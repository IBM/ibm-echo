/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import CollectionsView from "./CollectionsView";
import SettingsView from "./SettingsView";
import { useResizable } from "react-resizable-layout";
import RequestTabs from "./RequestTabs";
import { GlobalStore } from "../contexts/GlobalContext";
import Splitter from "./Splitter";
import { customAlphabet } from "nanoid";
import { flushSync } from "react-dom";
const nanoid = customAlphabet("1234567890abcdef", 10);

const firstItem = {
	id: "1",
	name: "My first collection",
	type: "group",
	items: [
		{
			id: "11",
			name: "My apis",
			type: "group",
			items: [
				{
					id: "3-1",
					name: "Demo sanity API",
					type: "request",
					method: "GET",
					endpoint:
						"https://echo-test.saashub-next-gen-test-7543ffbb0026f72e4c4bdf341a6ee84a-0000.us-south.containers.appdomain.cloud/sanity",
					description: "",
					headers: {},
					reqBody: "",
					reqBodyType: "json",
					queryParams: {},
					response: {},
					isTabOpen: true,
					isActive: true
				}
			]
		}
	]
};

function Tool() {
	const { isDragging, position, splitterProps } = useResizable({
		axis: "x",
		min: 220,
		initial: 250,
		max: 600
	});

	const [state, setState] = useState({
		apis: [],
		globalVars: [],
		certificates: [],
		selectedNode: "1",
		encodedUser: "ONLY AVAILABLE IF USER IS LOGGED IN!",
		user: ""
	});

	/**
	 * This is important, as this detects where this build of
	 * client is served, Electron desktop app or website, depending
	 * on that then URL is computed
	 */
	let serverURL =
		import.meta.env.VITE_APP_IS_ELECTRON_BUILD === "true"
			? "https://localhost:7857"
			: import.meta.env.VITE_APP_SERVER_URL;

	useEffect(() => {
		if (state.apis.length === 0) {
			let apis = window.localStorage.getItem("apis") || "[]";
			apis = JSON.parse(apis);
			if (apis && apis.length > 0) {
				setState((prevState) => ({ ...prevState, apis: apis }));
			} else {
				setState((prevState) => ({ ...prevState, apis: [firstItem] }));
			}
		} else {
			try {
				window.localStorage.setItem("apis", JSON.stringify(state.apis));
			} catch (err) {
				window.alert(err.message);
			}
		}
	}, [state.apis]);

	useEffect(() => {
		if (state.globalVars.length === 0) {
			let vars = window.localStorage.getItem("globalVars") || "[]";
			vars = JSON.parse(vars);
			if (vars.length > 0) {
				setState((prevState) => ({ ...prevState, globalVars: vars }));
			}
		} else {
			try {
				window.localStorage.setItem("globalVars", JSON.stringify(state.globalVars));
			} catch (err) {
				window.alert(err.message);
			}
		}
	}, [state.globalVars]);

	useEffect(() => {
		if (state.certificates.length === 0) {
			let certificates = window.localStorage.getItem("certificates") || "[]";
			certificates = JSON.parse(certificates);
			if (certificates && certificates.length > 0) {
				setState((prevState) => ({ ...prevState, certificates: certificates }));
			}
		} else {
			try {
				window.localStorage.setItem("certificates", JSON.stringify(state.certificates));
			} catch (err) {
				window.alert(err.message);
			}
		}
	}, [state.certificates]);

	const setGlobalStore = (obj) => {
		setState((prevState) => ({ ...prevState, ...JSON.parse(JSON.stringify(obj)) }));
	};

	const updateItemById = (targetId, keyName, keyValue) => {
		let apis = JSON.parse(JSON.stringify(state.apis));
		const update = (data) => {
			for (let item of data) {
				if (item.id === targetId) {
					if (Array.isArray(keyName)) {
						for (let i = 0; i < keyName.length; i++) {
							item[keyName[i]] = keyValue[i];
						}
					}

					if (!Array.isArray(keyName)) {
						item[keyName] = keyValue;
					}

					continue;
				}

				if (item.items) {
					update(item.items);
				}
			}
		};

		update(apis);
		setState((prevState) => ({ ...prevState, apis }));
	};

	const updateChainItemById = (_id, _chainId, keyName, keyValue) => {
		let apis = window.localStorage.getItem("apis") || "[]";
		apis = JSON.parse(apis);
		const update = (data) => {
			for (let item of data) {
				if (item.id === _id) {
					for (let req of item.chain) {
						if (req.id === _chainId) {
							if (Array.isArray(keyName)) {
								for (let i = 0; i < keyName.length; i++) {
									req[keyName[i]] = keyValue[i];
								}
							}

							if (!Array.isArray(keyName)) {
								req[keyName] = keyValue;
							}
						}
					}

					continue;
				}

				if (item.items) {
					update(item.items);
				}
			}
		};

		update(apis);

		flushSync(() => {
			setState((prevState) => ({ ...prevState, apis }));
		});
	};

	const updateHelper = (data, _id, flag, selectedNode, _parents = []) => {
		for (let item of data) {
			if (item.id === _id) {
				item.isActive = flag;
				item.isTabOpen = flag;
				selectedNode = item.id;

				if (flag) {
					/**
					 * Expand all parent folders if any
					 */
					_parents.forEach((parent) => {
						parent.isExpanded = true;
					});
				}
				continue;
			}

			if (item.id !== _id) {
				item.isActive = false;
			}

			if (item.items) {
				item.isExpanded = false;
				updateHelper(item.items, _id, flag, selectedNode, [item, ..._parents]);
			}
		}
	};

	const activateItem = (_id, flag = true) => {
		let apis = JSON.parse(JSON.stringify(state.apis));
		let selectedNode = state.selectedNode;
		updateHelper(apis, _id, flag, selectedNode, []);
		setState((prevState) => ({ ...prevState, apis, selectedNode }));
	};

	const closeAllTabs = (ids) => {
		let apis = JSON.parse(JSON.stringify(state.apis));
		const update = (data) => {
			for (let item of data) {
				if (ids.includes(item.id) && !item.isActive) {
					item.isTabOpen = false;
					continue;
				}

				if (item.items) {
					update(item.items);
				}
			}
		};

		update(apis);
		setState((prevState) => ({ ...prevState, apis }));
	};

	const deleteHelper = (data, _id) => {
		for (let i = 0; i < data.length; i++) {
			if (data[i].id === _id) {
				data.splice(i, 1);
				return true; // Item found and deleted
			}

			if (data[i].items) {
				const deleted = deleteHelper(data[i].items, _id);
				if (deleted) return true; // Item found in nested items and deleted
			}
		}

		return false; // Item not found
	};

	const deleteItemById = (_id) => {
		let apis = JSON.parse(JSON.stringify(state.apis));
		let found = deleteHelper(apis, _id);
		setState((prevState) => ({ ...prevState, apis }));
		if (!found) {
			// Search item in certificates
			let certificates = JSON.parse(JSON.stringify(state.certificates));
			deleteHelper(certificates, _id);
			setState((prevState) => ({ ...prevState, certificates }));
		}
	};

	const changeItemLocation = (_groupId, sourceItem) => {
		let apis = JSON.parse(JSON.stringify(state.apis));
		let selectedNode = state.selectedNode;
		const update = (data) => {
			for (let i = 0; i < data.length; i++) {
				if (data[i].id === _groupId && data[i].type === "group") {
					const keys = ["id"];
					data[i].items = [...data[i].items, sourceItem].filter(
						(value, index, self) => self.findIndex((v) => keys.every((k) => v[k] === value[k])) === index
					);

					return true;
				}

				if (data[i].items) {
					update(data[i].items);
				}
			}

			return false; // Item not found
		};

		deleteHelper(apis, sourceItem.id);
		update(apis);
		updateHelper(apis, sourceItem.id, true, selectedNode, []);
		setState((prevState) => ({ ...prevState, apis, selectedNode }));
	};

	const addNew = (_groupId, type = "request") => {
		let apis = JSON.parse(JSON.stringify(state.apis));
		let selectedNode = state.selectedNode;
		let requestId = nanoid();

		if (!_groupId && type === "chain") {
			apis = [
				...apis,
				{
					id: requestId,
					type: "chain",
					name: "Untitled API chain *",
					chain: [],
					isTabOpen: true,
					isActive: true
				}
			];
			setState((prevState) => ({ ...prevState, apis, selectedNode }));
			return;
		}

		const update = (data) => {
			for (let i = 0; i < data.length; i++) {
				if (data[i].id === _groupId && data[i].type === "group") {
					let isUntitledPresent = false;
					let createRunTest = true;
					data[i].items.forEach((item) => {
						if (type === "runTest" && item.name === "Test runner") {
							createRunTest = false;
						}
					});

					if (!isUntitledPresent && createRunTest) {
						let obj = {};
						if (type === "request") {
							obj = {
								id: requestId,
								type: "request",
								method: "GET",
								endpoint: "",
								name: "Untitled request *",
								description: "",
								headers: {},
								reqBody: "",
								reqBodyType: "json",
								queryParams: {},
								response: {},
								isTabOpen: true,
								isActive: true
							};
						}

						if (type === "group") {
							obj = {
								id: requestId,
								type: "group",
								name: "Untitled group *",
								items: []
							};
						}

						if (type === "runTest") {
							obj = {
								id: requestId,
								type: "runTest",
								name: "Test runner",
								isTabOpen: true,
								isActive: true
							};
						}

						if (type === "chain") {
							obj = {
								id: requestId,
								type: "chain",
								name: "Untitled chain *",
								chain: []
							};
						}

						data[i].items = [obj, ...data[i].items];
					}
				}

				if (data[i].items) {
					update(data[i].items);
				}
			}

			return requestId; // Item not found
		};

		let id = update(apis);
		updateHelper(apis, id, true, selectedNode, []);
		setState((prevState) => ({ ...prevState, apis, selectedNode }));
	};

	const getById = (_id) => {
		let apis = JSON.parse(JSON.stringify(state.apis));
		let retVal = {};
		const get = (data) => {
			for (let item of data) {
				if (item.id === _id) {
					retVal = JSON.parse(JSON.stringify(item));
					break;
				}

				if (item.items) {
					get(item.items);
				}
			}
		};

		get(apis);
		return retVal;
	};

	const findAndAddCertsForEndpoint = (request, endpoint) => {
		// Extract host and port from endpoint and check if client SSL certificate is configured
		let url = new URL(endpoint);
		let host = url.protocol + "//" + url.host.split(":")[0];
		let port = url.port ? url.port : undefined;

		state.certificates.forEach((element) => {
			if (element.host === host && element.port === port) {
				request.certificate = element.crt;
				request.key = element.key;
				request.passphrase = element.passphrase;
			}
		});
	};

	const addGlobalVariable = (obj) => {
		setState((prevState) => ({ ...prevState, globalVars: [...prevState.globalVars, obj] }));
	};

	const removeGlobalVariable = (obj) => {
		setState((prevState) => ({
			...prevState,
			globalVars: prevState.globalVars.filter((elem) => elem.key !== obj.key && elem.value !== obj.value)
		}));
	};

	return (
		<GlobalStore.Provider
			value={{
				globalStore: state,
				setGlobalStore,
				updateItemById,
				updateChainItemById,
				activateItem,
				closeAllTabs,
				changeItemLocation,
				deleteItemById,
				addNew,
				getById,
				findAndAddCertsForEndpoint,
				addGlobalVariable,
				removeGlobalVariable
			}}
		>
			<div className="tool">
				<div
					className="tool-leftPanel"
					style={{ width: position }}
				>
					<CollectionsView />
					<SettingsView />
				</div>
				<Splitter
					isDragging={isDragging}
					{...splitterProps}
				/>
				<div
					className="tool-rightPanel"
					style={{ width: `calc(100vw - ${position}px)` }}
				>
					<RequestTabs position={position} />
				</div>
			</div>
		</GlobalStore.Provider>
	);
}

export default Tool;
