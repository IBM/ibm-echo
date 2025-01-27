/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileUploaderDropContainer, FileUploaderItem, Modal, RadioButton, RadioButtonGroup } from "@carbon/react";
import React, { useState, useContext, useEffect } from "react";
import { customAlphabet } from "nanoid";
import { GlobalStore } from "../contexts/GlobalContext";

function ImportCollectionModal(props) {
	const { globalStore, setGlobalStore } = useContext(GlobalStore);
	const [file, setFile] = useState({ file: null, isFileSelected: false, fileErrorMessage: null });
	const [importSource, setImportSource] = useState("Postman");

	// Insomnia import related constants
	const InsomniaResourceType = {
		REQUEST_GROUP: "request_group",
		REQUEST: "request",
		ENVIRONMENT: "environment",
		WORKSPACE: "workspace"
	};
	const WORKSPACE_ID_PREFIX = "wrk_";

	useEffect(() => {
		console.log("ImportCollectionModal: globalStore changed - ", globalStore);
	}, [globalStore]);

	const addNewCollection = (newCollection) => {
		let storeCopy = JSON.parse(JSON.stringify(globalStore));
		storeCopy.apis = [JSON.parse(JSON.stringify(newCollection)), ...storeCopy.apis];
		setGlobalStore(storeCopy);
	};

	const updateStateWithInsomniaImportData = (collections, requests, globalVars) => {
		let storeCopy = JSON.parse(JSON.stringify(globalStore));
		storeCopy.apis = [...collections, ...storeCopy.apis, ...requests];
		storeCopy.globalVars = globalVars;
		setGlobalStore(storeCopy);
	};

	const importInsomniaWorkspace = (data) => {
		/**
		 * One workspace can contain multiple collections and their parentId
		 * contains prefix 'wrk_' which refers to workspace.
		 */
		let collections = {};
		let folders = {}; // Map of parentId -> [folders]
		let requests = {}; // Map of parentId -> [requests]
		let orphans = []; // Workspace holds the requests which are not under any collection
		let globalVars = []; // Environment variables

		const nanoid = customAlphabet("1234567890abcdef", 10);
		const resources = [...data.resources];

		resources.forEach((item) => {
			switch (item._type) {
				case InsomniaResourceType.REQUEST:
					if (item.parentId.startsWith(WORKSPACE_ID_PREFIX)) {
						// This is an orhpan request
						orphans.push(item);
					} else {
						// This request belongs to a collection
						requests[item.parentId] = requests[item.parentId] != null ? [...requests[item.parentId], item] : [item];
					}
					break;

				case InsomniaResourceType.REQUEST_GROUP:
					if (item.parentId.startsWith(WORKSPACE_ID_PREFIX)) {
						// This is a collection
						collections[item._id] = item;
					} else {
						// This is a sub folder inside a collection
						folders[item.parentId] = folders[item.parentId] != null ? [...folders[item.parentId], item] : [item];
					}
					break;

				case InsomniaResourceType.ENVIRONMENT:
					globalVars = importEnvironmentVariables(item);
					break;

				default:
					console.log("Unexpected resource type: ", item._type);
			}
		});

		// Generate tree view
		function generateTree(parentId) {
			// Get all subfolders for current collection/folder
			let subFolders = folders[parentId];
			let apis = requests[parentId];

			// Construct objects for subfolders and requests in required format
			let items = [];
			if (subFolders) {
				subFolders.map((item) => {
					let folderObj = {
						name: item.name,
						id: nanoid(),
						type: "group",
						descriptipn: item.description,
						isExpanded: true,
						items: generateTree(item._id)
					};
					items.push(folderObj);
				});
			}

			if (apis) {
				apis.map((item) => {
					items.push(getRequest(item, nanoid()));
				});
			}

			return items;
		}

		try {
			// Create collections
			let collectionObjects = [];
			for (let [key, collection] of Object.entries(collections)) {
				let collectionObj = {
					type: "group",
					name: collection.name,
					description: collection.description,
					id: nanoid(),
					items: generateTree(collection._id)
				};
				collectionObjects.push(JSON.parse(JSON.stringify(collectionObj)));
			}

			// Create orphan requests
			let orphanRequests = [];
			orphans.forEach((req) => {
				orphanRequests.push(getRequest(req, nanoid()));
			});

			// Add objects to Collection view and environment variables to global state
			updateStateWithInsomniaImportData(collectionObjects, orphanRequests, globalVars);

			handleClearFile();
			props.handleCloseCollectionModal();
		} catch (error) {
			console.log("An error occurred while importing from Insomnia: ", error);
		}
	};

	// This method returns a request object for collection view using an item from Insomnia
	const getRequest = (item, requestId) => {
		let queryObj = {};
		let reqBody = {};
		let headerObj = {};
		let reqBodyType = null;

		if (item.body) {
			reqBody = item.body.text;
			if (item.body.mimeType === "application/json") {
				reqBodyType = "json";
			} else if (item.body.mimeType === "application/xml") {
				reqBodyType = "xml";
			} else {
				reqBodyType = "urlencoded";
			}
		}
		if (item.parameters && item.parameters.length > 0) {
			item.parameters.forEach((q) => {
				queryObj = { ...queryObj, [q.name]: replaceInsomniaVarPlaceholder(q.value) };
			});
		}
		if (item.headers && item.headers.length > 0) {
			item.headers.forEach((h) => {
				headerObj = { ...headerObj, [h.name]: replaceInsomniaVarPlaceholder(h.value) };
			});
		}

		/**
		 * Create endpoint after replacing correct environment variable placeholder.
		 * Also append query params towards the end - this is to avoid the issue of
		 * missing query parameters on opening request in a tab.
		 */
		let endpoint = replaceInsomniaVarPlaceholder(item.url);
		if (queryObj) {
			const queryString = Object.keys(queryObj)
				.map((key) => `${key}=${queryObj[key]}`)
				.join("&");
			endpoint = `${endpoint}?${queryString}`;
		}

		let request = {
			id: requestId,
			type: "request",
			method: item.method || "GET",
			endpoint: endpoint,
			name: item.name,
			description: "",
			headers: headerObj,
			reqBody: reqBody || "",
			reqBodyType: reqBodyType,
			queryParams: queryObj,
			response: {},
			isTabOpen: false,
			isActive: false
		};

		return JSON.parse(JSON.stringify(request));
	};

	const replaceInsomniaVarPlaceholder = (input) => {
		/**
		 * Insomnia represents environment variables as below -
		 * Single word variables: {{ _.env }} {{ _.single }}
		 * Special symbols, multi-word variables: {{ _['@'] }} {{ _['two words'] }} {{ _['host-name'] }}
		 *
		 * Hence, we need to replace this placeholder into our format {{env}}
		 */
		const regex = /{{ _\['(.*?)'\] }}|{{ _\.([^\s]+) }}/g;
		const replaced = input.replace(regex, (match, word1, word2) => {
			return `{{${word1 || word2}}}`;
		});
		return replaced;
	};

	const importEnvironmentVariables = (item) => {
		let vars = item.data;
		let globalVars = [];

		for (var key in vars) {
			globalVars.push(JSON.parse(JSON.stringify({ key: key, value: vars[key] })));
		}

		return globalVars;
	};

	const handleImportCollection = () => {
		if (!file.file && !file.isFileSelected) {
			setFile({
				file: null,
				fileErrorMessage: `Select a .json export file from ${importSource}`,
				isFileSelected: false
			});
			return;
		}

		var reader = new FileReader();
		reader.readAsText(file.file);

		if (importSource === "Insomnia") {
			reader.onload = (event) => {
				let data = JSON.parse(event.target.result);
				importInsomniaWorkspace(data);
			};
			return;
		}

		reader.onload = (event) => {
			const nanoid = customAlphabet("1234567890abcdef", 10);
			function convertToTreeView(original) {
				if (!original || !Array.isArray(original)) {
					return [];
				}

				return original.map((item) => {
					if (item.item) {
						return {
							name: item.name,
							id: nanoid(),
							type: "group",
							descriptipn: item.descriptipn,
							isExpanded: true,
							items: convertToTreeView(item.item)
						};
					} else {
						let queryObj = {},
							reqBody = {},
							headerObj = {},
							reqBodyType = "json";

						try {
							if (item?.request?.body?.raw) {
								if (item?.request?.body?.options?.raw?.language === "xml" || item?.request?.reqBodyType	=== "xml") {
									reqBody = item?.request?.body?.raw
									reqBodyType = "xml";
								} else {
									reqBody = JSON.parse(item?.request?.body?.raw);
								}
									reqBodyType = "json";
							} else if (item?.request?.body?.mode === "urlencoded") {
								const urlencoded = item.request.body.urlencoded || [];
								reqBody = urlencoded.map((param) => `${param.key}:${param.value}`).join("\n");
								reqBodyType = "urlencoded";
							}
						} catch (err) {
							reqBody = item?.request?.body?.raw;
						}
						if (item["request"]["url"] && item["request"]["url"]["query"]) {
							item["request"]["url"]["query"].forEach((q) => {
								queryObj = { ...queryObj, [q.key]: q.value };
							});
						}

						item["request"]["header"].forEach((h) => {
							headerObj = { ...headerObj, [h.key]: h.value };
						});
						return {
							id: nanoid(),
							type: "request",
							method: item?.request?.method || "GET",
							endpoint: item?.request?.url?.["raw"] || "",
							name: item["name"],
							description: "",
							headers: headerObj,
							reqBody: reqBody || "",
							reqBodyType: reqBodyType,
							queryParams: queryObj,
							response: item["response"] || {},
							isTabOpen: false,
							isActive: false
						};
					}
				});
			}

			try {
				let result = JSON.parse(event.target.result);
				console.log("result -- ", result);
				const nanoid = customAlphabet("1234567890abcdef", 10);
				let collectionId = nanoid();

				let newCollection = {
					type: "group",
					name: result["info"]["name"],
					description: result["info"]["description"],
					id: collectionId,
					items: convertToTreeView(result.item)
				};

				addNewCollection(newCollection);
				handleClearFile();
				props.handleCloseCollectionModal();
			} catch (error) {
				console.log("error -- ", error);
				setFile({
					...file,
					fileErrorMessage: `${file.file.name} is not a valid json schema!`
				});
			}
		};
	};

	const handleFileChange = (eve, addedFiles) => {
		setFile({ file: addedFiles[0], isFileSelected: true, fileErrorMessage: null });
	};

	const handleClearFile = () => {
		setFile({ file: null, isFileSelected: false, fileErrorMessage: null });
	};

	const handleImportSourceChange = (eve) => {
		setImportSource(eve);
	};

	return (
		<Modal
			size="sm"
			open={true}
			modalHeading="Import collection"
			primaryButtonText="Import"
			secondaryButtonText="Cancel"
			onRequestClose={props.handleCloseCollectionModal}
			onRequestSubmit={handleImportCollection}
		>
			<div className="importCollection">
				<RadioButtonGroup
					onChange={handleImportSourceChange}
					legendText="Import from"
					name="radio-button-group"
					defaultSelected={importSource}
				>
					<RadioButton
						labelText="Postman (v2.1 Schema)"
						value="Postman"
						id="Postman"
					/>
					<RadioButton
						labelText="Insomnia"
						value="Insomnia"
						id="Insomnia"
					/>
					<RadioButton
						labelText="Echo"
						value="Echo"
						id="Echo"
					/>
					<RadioButton
						disabled
						labelText="OpenAPI"
						value="OpenAPI"
						id="OpenAPI"
					/>
				</RadioButtonGroup>
			</div>
			{file.fileErrorMessage && (
				<p
					className="cds--label"
					style={{
						marginBottom: "10px",
						color: file.fileErrorMessage ? "#da1e28" : ""
					}}
				>
					{file.fileErrorMessage}
				</p>
			)}
			{!file.isFileSelected && (
				<FileUploaderDropContainer
					accept={["*.json"]}
					className="importOffering-fileUploader"
					labelText={"Select a file"}
					onAddFiles={(eve, { addedFiles }) => handleFileChange(eve, addedFiles)}
				></FileUploaderDropContainer>
			)}
			{file.isFileSelected && (
				<FileUploaderItem
					style={{
						border: file.fileErrorMessage ? "1px solid #da1e28" : ""
					}}
					iconDescription="Clear file"
					name={file.file?.name}
					onDelete={handleClearFile}
					size="md"
					status="edit"
				/>
			)}
		</Modal>
	);
}

export default ImportCollectionModal;
