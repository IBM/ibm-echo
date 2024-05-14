/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExecutableProgram, Json, TrashCan } from "@carbon/react/icons";
import {
	Breadcrumb,
	BreadcrumbItem,
	Button,
	Modal,
	Tag,
	Tabs,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	TextArea,
	InlineLoading,
	ToastNotification,
	Dropdown
} from "@carbon/react";
import React, { useContext, useEffect, useRef } from "react";
import GlobalContextProvider, { GlobalStore } from "../contexts/GlobalContext";
import Draggable from "react-draggable";
import { useState } from "react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import axios from "axios";
import jsonpath from "jsonpath";
import TextInput from "react-autocomplete-input";

import Editor, { loader } from "@monaco-editor/react";
loader.init().then((monaco) => {
	monaco.editor.defineTheme("default", {
		base: "vs",
		inherit: true,
		rules: [],
		colors: {
			"editor.background": "#f4f4f4"
		}
	});
	monaco.editor.setTheme("default");
});

const items = [
	{ id: "json", text: "json" },
	{ id: "urlencoded", text: "x-www-form-urlencoded" }
];

const DraggableApi = ({
	api,
	onDrag,
	onDrop,
	onDragStart,
	onDragEnd,
	handleSetReponseJsonPath,
	handleRemoveApiFromChain,
	chainApi
}) => {
	const updateXarrow = useXarrow();
	const getColorScheme = (method) => {
		if (method === "GET") return "green";
		if (method === "DELETE") return "red";
		if (method === "PUT") return "orange";
		if (method === "POST") return "teal";
		return "grey";
	};

	const handleStartApiDrag = (evt) => {
		evt.stopPropagation();
		evt.preventDefault();
		evt.persist();
	};

	let apiStatus = {};
	let apiLoadingStatus = "";
	if (chainApi.hasOwnProperty("isExecuting") && chainApi.isExecuting) {
		apiStatus = { outline: "2px solid grey", animation: "executing 400ms ease infinite" };
		apiLoadingStatus = "active";
	} else if (chainApi.hasOwnProperty("isExecuting") && !chainApi.isExecuting && chainApi.isError) {
		apiStatus = { outline: "1px solid red" };
		apiLoadingStatus = "error";
	} else if (chainApi.hasOwnProperty("isExecuting") && !chainApi.isExecuting && !chainApi.isError) {
		apiStatus = { outline: "1px solid #24a148" };
		apiLoadingStatus = "finished";
	}

	return (
		<Draggable
			// defaultPosition={{ x: api.posX || 25, y: api.posY || 25 }}
			scale={1}
			bounds={"#playground"}
			onStart={handleStartApiDrag}
			defaultClassNameDragging="api-dragging"
			cancel=".draggable-api-content"
			onDrag={updateXarrow}
			onStop={(evt) => {
				updateXarrow();
				onDrop(evt, api, true);
			}}
		>
			<div
				className="draggable-api"
				id={`node-${api.id}`}
				draggable={true}
				onDrop={(evt) => onDrop(evt, api)}
				style={apiStatus}
			>
				<div className="draggable-api-title cds--label">
					<Tag
						size="md"
						type={getColorScheme(api.method)}
					>
						{api.method}
					</Tag>
					<span className="api-chain-title">{api.name}</span>
					<div className="api-executing">
						<InlineLoading status={apiLoadingStatus} />
					</div>
				</div>
				<div className="draggable-api-content">
					<div className="left">
						<div
							className="link"
							id={`node-${api.id}`}
							draggable={true}
							onDrag={(evt) => onDrag(evt, api)}
							onDragStart={onDragStart}
							onDragEnd={onDragEnd}
						></div>
					</div>
					<div className="right">
						<div
							className="link"
							id={`node-${api.id}`}
							draggable={true}
							onDrag={(evt) => onDrag(evt, api)}
							onDragStart={onDragStart}
							onDragEnd={onDragEnd}
						></div>
					</div>
					<div className="top">
						<div
							className="link"
							id={`node-${api.id}`}
							draggable={true}
							onDrag={(evt) => onDrag(evt, api)}
							onDragStart={onDragStart}
							onDragEnd={onDragEnd}
						></div>
					</div>
					<div className="bottom">
						<div
							className="link"
							id={`node-${api.id}`}
							draggable={true}
							onDrag={(evt) => onDrag(evt, api)}
							onDragStart={onDragStart}
							onDragEnd={onDragEnd}
						></div>
					</div>
					{chainApi.responseData && Object.keys(chainApi.responseData).length > 0 && (
						<Button
							className="apiChainBtn"
							size="sm"
							kind="ghost"
							onClick={() => handleSetReponseJsonPath(chainApi, true)}
						>
							<div>Response</div>
							<div>{chainApi.executionTime}</div>
						</Button>
					)}
					<Button
						className="apiChainBtn"
						size="sm"
						kind="tertiary"
						onClick={() => handleSetReponseJsonPath(chainApi)}
						renderIcon={Json}
					>
						Set paramters
					</Button>

					<Button
						className="apiChainBtn"
						size="sm"
						renderIcon={TrashCan}
						kind="tertiary"
						tooltipPosition="right"
						iconDescription="Remove this api from chain"
						onClick={() => handleRemoveApiFromChain(api)}
					>
						Remove
					</Button>
				</div>
			</div>
		</Draggable>
	);
};

function ApiChain(props) {
	const { updateItemById, updateChainItemById, getById, findAndAddCertsForEndpoint, globalStore } =
		useContext(GlobalStore);
	const updateXarrow = useXarrow();
	const currentArrowRef = useRef(null);
	const draggingArrowRef = useRef(null);
	const [state, setState] = useState({
		isJsonPathModalOpen: false,
		selectedApi: null,
		arrows: [],
		firstNodeId: null
	});

	useEffect(() => {
		if (props.requestData.chainMap && props.requestData.chainMap.length > 0) {
			setState((prevState) => ({ ...prevState, firstNodeId: props.requestData.chainMap[0].from }));
		}
	}, [props.requestData.chainMap]);

	useEffect(() => {
		if (state.isChainExecuting) {
			//Call api
			executeChain();
		}
	}, [state.isChainExecuting]);

	const resovler = (obj, val) => {
		let tokens = val.split(" ");
		for (let token of tokens) {
			try {
				let resolvedValue = jsonpath.query(obj, token.trim());
				if (resolvedValue.length > 0) {
					val = val.replace(token.trim(), resolvedValue[0]);
				}
			} catch (error) {}
		}

		return val;
	};

	const runReplacements = (type, text) => {
		let match = null,
			flag = true;

		let array = Object.entries(text);

		if (type === "string") {
			while ((match = /{{(.*?)}}/g.exec(text)) !== null && flag) {
				let matched = globalStore.globalVars.find((variable) => variable.key === match[1]);
				if (matched) {
					flag = true;
					text = text.replace(`{{${match[1]}}}`, matched.value);
				} else {
					flag = false;

					setState({
						showToast: true,
						toastType: "error",
						toastMsg: `The environment variable {{${match[1]}}} referenced in the chain node was not found. Please add it in Settings -> Environment variables`
					});
				}
			}

			return { text, flag };
		}

		if (type === "object") {
			for (let idx = 0; idx < array.length; idx++) {
				if ((match = /{{(.*?)}}/g.exec(array[idx][0])) !== null) {
					let matched = globalStore.globalVars.find((variable) => variable.key === match[1]);
					if (matched) {
						flag = true;
						array[idx][0] = array[idx][0].replace(`${match[0]}`, matched.value);
					} else {
						flag = false;
					}
				}

				if ((match = /{{(.*?)}}/g.exec(array[idx][1])) !== null) {
					let matched = globalStore.globalVars.find((variable) => variable.key === match[1]);
					if (matched) {
						flag = true;
						array[idx][1] = array[idx][1].replace(`${match[0]}`, matched.value);
						continue;
					}

					if (!matched) {
						/**
						 * In right side values i.e. values provided after colon can
						 * have resolutions from Last node response
						 *
						 * also if not found in global vars, that means values are from last node response
						 * just remove template literals `{{` `}}` and `jsonpath resolver` will
						 * take care of resolution
						 */
						array[idx][1] = array[idx][1].replace(/{{|}}/g, "");
						flag = true;
						continue;
					}

					flag = false;
				}

				if (!flag) {
					setState({
						showToast: true,
						toastType: "error",
						toastMsg: `The environment variable {{${match[1]}}} referenced in the chain node was not found. Please add it in Settings -> Environment variables`
					});
					break;
				}
			}

			return { text: Object.fromEntries(array), flag };
		}
	};

	const executeChain = async () => {
		let chain = createSequence(props.requestData.chainMap, props.requestData.chain);
		chain.forEach((api, idx) => {
			/**
			 * Resolve {{template}} environment
			 * variables for endpoint url
			 */
			let replacedEndpoint = runReplacements("string", api.endpoint);
			if (!replacedEndpoint.flag) return;
			if (replacedEndpoint.flag) {
				api.endpoint = replacedEndpoint.text;
			}

			if (idx > 0) {
				let lastNodeResponse = getLastNodeResponse(api.id);

				/**
				 * Resolve {{template}} environment
				 * variables for query params
				 */
				let replacedQueryParams = runReplacements("object", api.queryParams);
				if (!replacedQueryParams.flag) return;
				if (replacedQueryParams.flag) {
					api.queryParams = replacedQueryParams.text;
				}

				/**
				 * Resolve {{template}} environment
				 * variables for headers
				 */
				let replacedHeaders = runReplacements("object", api.headers);
				if (!replacedHeaders.flag) return;
				if (replacedHeaders.flag) {
					api.headers = replacedHeaders.text;
				}

				// Resolve headers
				for (const [key, val] of Object.entries(api.headers)) {
					api.headers[key] = resovler(lastNodeResponse, val);
				}

				// Resolve queryParams
				for (const [key, val] of Object.entries(api.queryParams)) {
					api.queryParams[key] = resovler(lastNodeResponse, val);
				}

				// Resolve body
				if (api.reqBodyType !== "urlencoded" && typeof api.reqBody === "object") {
					for (const [key, val] of Object.entries(api.reqBody)) {
						api.reqBody[key] = resovler(lastNodeResponse, val);
					}
				}

				if (api.reqBodyType === "urlencoded" && typeof api.reqBody === "string") {
					api.reqBody = resovler(lastNodeResponse, api.reqBody);
				}
			}
		});

		try {
			for await (let api of chain) {
				await executeApi(api);
			}
		} catch (error) {}
		setState((prevState) => ({ ...prevState, isChainExecuting: false }));
	};

	const executeApi = async (api) => {
		return new Promise(async (resolve, reject) => {
			try {
				updateChainItemById(props.requestData.id, api.id, "isExecuting", true);

				let url = new URL(api.endpoint);
				let request = new Object();
				request.method = api.method.toLowerCase();
				request.url = url.origin + url.pathname;
				request.headers = api.headers ? api.headers : {};
				request.reqBody = api.reqBody ? api.reqBody : {};
				request.reqBodyType = api.reqBodyType ? api.reqBodyType : "";
				if (api.reqBodyType === "urlencoded") {
					request.reqBody = api.reqBody.replace(/\\n/g, "\n");
				}

				if (Object.keys(api.queryParams).length > 0) {
					const encoded = Object.entries(api.queryParams)
						.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
						.join("&");
					request.url += `?${encoded}`;
				}

				findAndAddCertsForEndpoint(request, request.url);

				/**
				 * This is important, as this detects where this build of
				 * client is served, Electron desktop app or website, depending
				 * on that then URL is computed
				 */
				let serverURL =
					import.meta.env.VITE_APP_IS_ELECTRON_BUILD === "true"
						? "https://localhost:7857"
						: import.meta.env.VITE_APP_SERVER_URL;

				let response = await axios({
					method: "post",
					url: `${serverURL}/proxy`,
					data: JSON.parse(JSON.stringify(request))
				});

				updateChainItemById(
					props.requestData.id,
					api.id,
					["isExecuting", "isError", "responseData", "responseHeaders", "executionTime", "responseSize"],
					[false, false, response.data.data, response.headers, response.data.executionTime, response.data.responseSize]
				);

				resolve();
			} catch (error) {
				console.log(error);
				let executionTime, responseSize;
				if (error.response) {
					if (error.response.data) {
						executionTime = error.response.data["executionTime"];
						responseSize = error.response.data["responseSize"];
						error.response.data["executionTime"] = undefined;
						error.response.data["responseSize"] = undefined;
					}
				}
				updateChainItemById(
					props.requestData.id,
					api.id,
					["isExecuting", "isError", "responseData", "responseHeaders", "executionTime", "responseSize"],
					[false, true, error?.response, error?.response?.headers || {}, executionTime, responseSize]
				);

				setState((prevState) => ({
					...prevState,
					showToast: true,
					toastType: "error",
					toastMsg: `Chain execution was stopped as API: ${api.name} responded with ${
						error.response?.status || error.message
					}`
				}));
				reject();
			}
		});
	};

	const createSequence = (edges, nodes) => {
		const sequence = [];
		const addedNodeIds = [];

		// Create a map to quickly look up nodes by their ID
		const nodeMap = {};
		for (const node of nodes) {
			nodeMap[node.id] = node;
		}

		// Traverse the edges and build the sequence
		for (const edge of edges) {
			if (nodeMap[edge.from] && !addedNodeIds.includes(edge.from)) {
				sequence.push(nodeMap[edge.from]);
				addedNodeIds.push(edge.from);
			}
			if (nodeMap[edge.to] && !addedNodeIds.includes(edge.to)) {
				sequence.push(nodeMap[edge.to]);
				addedNodeIds.push(edge.to);
			}
		}

		return sequence;
	};

	const getQueryParams = (url) => {
		const params = {};
		const urlSearchParams = new URLSearchParams(url.split("?")[1]);
		for (const [key, value] of urlSearchParams.entries()) {
			params[key] = value || true;
		}
		return params;
	};

	const handleDrop = (evt) => {
		evt.stopPropagation();
		evt.preventDefault();
		var data = evt.dataTransfer.getData("json");
		if (data && data.length > 0) {
			data = JSON.parse(data);

			let isRequestAlreadyPresentInChain = props.requestData.chain.findIndex((i) => i.id === data.id);
			if (isRequestAlreadyPresentInChain === -1) {
				let chainMap = props.requestData.chainMap;
				updateItemById(
					props.requestData.id,
					["chain", "chainMap"],
					[
						[
							...props.requestData.chain,
							{
								id: data.id,
								...data,
								response: {},
								queryParams: getQueryParams(data.endpoint)
							}
						],
						chainMap ? [...chainMap] : []
					]
				);
			}
		}
	};

	const handleOnDragOver = (evt) => {
		evt.stopPropagation();
		evt.preventDefault();
		evt.persist();
	};

	const handleRequestName = () => {
		let elem = document.getElementById(`requestName-${props.requestData.id}`);
		if (elem.innerText.trim().length === 0) {
			elem.innerText = props.requestData.name;
		}

		if (elem.innerText.trim().length > 0 && elem.innerText.toLowerCase().includes("untitled")) {
			elem.innerText = props.requestData.name;
		} else {
			updateItemById(props.requestData.id, "name", elem.innerText);
		}
	};

	const handleSetReponseJsonPath = (api, showResponse) => {
		setState((prevState) => ({
			...prevState,
			isJsonPathModalOpen: true,
			selectedApi: api,
			showResponse: showResponse
		}));
	};

	const handleRemoveApiFromChain = (api) => {
		let chainedApis = props.requestData.chain.filter((item) => item.id !== api.id);
		let arrows = JSON.parse(JSON.stringify(props.requestData.chainMap));
		arrows = arrows.filter((ar) => ar.from !== api.id && ar.to !== api.id);
		updateItemById(props.requestData.id, ["chain", "chainMap"], [chainedApis, arrows]);
	};

	const handleCloseJsonPathModal = () => {
		setState((prevState) => ({ ...prevState, isJsonPathModalOpen: false, selectedApi: null }));
	};

	const handleSelectJsonPath = () => {
		setState((prevState) => ({ ...prevState, isJsonPathModalOpen: false, selectedApi: null }));
	};

	const handleOnDragForApi = (evt, api) => {
		currentArrowRef.current = `${api.id}`;
		draggingArrowRef.current.style.left = `${evt.clientX}px`;
		draggingArrowRef.current.style.top = `${evt.clientY}px`;
		updateXarrow();
	};

	const handleOnDragStartForApi = (evt) => {
		setState((prevState) => ({ ...prevState, isArrowDragging: true }));
	};

	const handleOnDragEndForApi = (evt) => {
		setState((prevState) => ({ ...prevState, isArrowDragging: false }));
	};

	const handleDropForApi = (evt, api, onlyUpdateXY) => {
		if (onlyUpdateXY) {
			const container = document.querySelector(".playground-wrapper");
			const element = evt.target;

			// Get the DOMRect for your targeted container
			const containerDomrect = container.getBoundingClientRect();

			// Get the DOMRect for you element to fetch the x-y coordinates
			const elementDomrect = element.getBoundingClientRect();

			// Then simply subtract the x-y values of the container from the element
			const xCoord = parseInt(elementDomrect.x - containerDomrect.x);
			const yCoord = parseInt(elementDomrect.y - containerDomrect.y);
			updateItemById(api.id, ["posX", "posY"], [xCoord, yCoord]);
			return;
		}
		let arrows = JSON.parse(JSON.stringify(props.requestData.chainMap));

		let isSameArrowPresent = arrows.findIndex(
			(arrow) => arrow.from === currentArrowRef.current && arrow.to === `${api.id}`
		);

		arrows.push({ from: currentArrowRef.current, to: `${api.id}`, isSelected: false });

		if (isSameArrowPresent === -1) {
			// Detect loop and avoid loop
			let isLoop = detectLoop(arrows);
			// Pointed twice
			let doublePointers = hasDuplicatePointers(arrows);

			if (isLoop) {
				alert("Loop detected in chain! This linkage is not possible");
				return;
			}

			if (!isLoop) {
				currentArrowRef.current = null;
			}

			if (doublePointers) {
				alert("A single node cannot be pointed to twice");
				return;
			}

			if (!isLoop && !doublePointers) {
				setState((prevState) => ({ ...prevState, firstNodeId: arrows[0].from }));
				updateItemById(props.requestData.id, "chainMap", arrows);
				return;
			}
		}
	};

	const handleArrowClick = (a) => {
		let arrows = props.requestData.chainMap;
		arrows.forEach((arrow) => {
			if (arrow.to === a.to && arrow.from === a.from) {
				arrow.isSelected = true;
			} else {
				arrow.isSelected = false;
			}
		});

		updateItemById(props.requestData.id, "chainMap", arrows);
	};

	const handleStartApiDrag = (evt) => {
		evt.stopPropagation();
		evt.preventDefault();
		evt.persist();
	};

	const hasDuplicatePointers = (jsonArray) => {
		const pointedNodes = new Set();

		for (const item of jsonArray) {
			const toNode = item.to;

			if (pointedNodes.has(toNode)) {
				return true; // Found a node pointed to more than once
			}

			pointedNodes.add(toNode);
		}

		return false; // No node is pointed to more than once
	};

	const detectLoop = (jsonArray) => {
		const graph = new Map();

		// Build the graph from the JSON array
		jsonArray.forEach((item) => {
			if (!graph.has(item.from)) {
				graph.set(item.from, []);
			}
			graph.get(item.from).push(item.to);
		});

		function dfs(node, visited) {
			visited.add(node);

			if (graph.has(node)) {
				for (const neighbor of graph.get(node)) {
					if (!visited.has(neighbor)) {
						if (dfs(neighbor, visited)) {
							return true;
						}
					} else {
						return true; // Detected a cycle
					}
				}
			}

			visited.delete(node);
			return false;
		}

		const visited = new Set();

		// Start DFS from each node in the graph
		for (const [node] of graph) {
			if (!visited.has(node)) {
				if (dfs(node, visited)) {
					return true; // Detected a cycle
				}
			}
		}

		return false; // No cycle detected
	};

	const handleDeleteArrow = (arrow) => {
		let arrows = props.requestData.chainMap.filter((ar) => !ar.isSelected);
		updateItemById(props.requestData.id, "chainMap", arrows);
	};

	const handleTextAreaChange = (value, type, selectedApi) => {
		if (type === "headers") {
			updateChainItemById(props.requestData.id, state.selectedApi.id, type, getHeaderStringToObj(value));
		} else if (type === "queryParams") {
			updateChainItemById(props.requestData.id, state.selectedApi.id, type, getHeaderStringToObj(value));
		} else if (type === "reqBody" && selectedApi.reqBodyType !== "urlencoded") {
			updateChainItemById(props.requestData.id, state.selectedApi.id, type, JSON.parse(value));
		} else if (type === "reqBody" && selectedApi.reqBodyType === "urlencoded") {
			updateChainItemById(props.requestData.id, state.selectedApi.id, type, value);
		}
	};

	const handleRequestBodyTypeChange = (value) => {
		updateChainItemById(props.requestData.id, state.selectedApi.id, "reqBodyType", value.selectedItem.id);
	};

	const getDefaultValues = (type) => {
		if (!state.selectedApi) return "";

		let obj = state.selectedApi;
		let value = "";
		if (type === "queryParams" && obj.queryParams) {
			for (const [key, val] of Object.entries(obj.queryParams)) {
				value += `${key}: ${val}\n`;
			}

			return value;
		}

		if (type === "headers" && obj.headers) {
			for (const [key, val] of Object.entries(obj.headers)) {
				value += `${key}: ${val}\n`;
			}

			return value;
		}

		if (type === "reqBody" && obj.reqBodyType === "urlencoded" && typeof obj.reqBody === "string") {
			return obj.reqBody.replace(/\\n/g, "\n");
		}

		if (type === "reqBody" && obj.reqBody && typeof obj.reqBody === "object") {
			return JSON.stringify(obj.reqBody, null, 4);
		}
	};

	const getHeaderStringToObj = (value) => {
		if (!value) return "";
		if (typeof value === "object" && Object.keys(value).length === 0) return "";
		if (typeof value === "object" && Object.keys(value).length > 0) return value;
		const headersArray = value
			.split("\n")
			.map((header) => header.trim())
			.filter((header) => header !== "");

		const headersObject = headersArray.reduce((acc, header) => {
			const firstColonIndex = header.indexOf(":");
			if (firstColonIndex !== -1) {
				const key = header.slice(0, firstColonIndex).trim();
				const value = header.slice(firstColonIndex + 1).trim();
				acc[key] = value;
			}
			return acc;
		}, {});

		return headersObject;
	};

	const getLastNodeResponse = (id) => {
		let edge = props.requestData.chainMap.find((arrow) => arrow.to === id);
		if (edge) {
			let node = props.requestData.chain.find((node) => node.id === edge.from);
			let request = getById(node.id);

			if (node.responseData) {
				return node.responseData;
			}

			if (request && request.responseData) {
				return request.responseData;
			}
		}
		return {};
	};

	const handleExecuteChain = () => {
		if (props.requestData.chain.length === 0) {
			setState({
				showToast: true,
				toastType: "error",
				toastMsg: "No nodes were found. Drag and drop requests from the Collection view!"
			});
			return;
		}

		if (props.requestData.chainMap.length === 0 && props.requestData.chain.length > 1) {
			setState({
				showToast: true,
				toastType: "error",
				toastMsg: "Please connect the nodes using links"
			});
			return;
		}

		if (props.requestData.chainMap.length === 0 && props.requestData.chain.length === 1) {
			setState({
				showToast: true,
				toastType: "error",
				toastMsg: "Chain should have atleast 2 nodes"
			});
			return;
		}

		setState((prevState) => ({ ...prevState, isChainExecuting: true }));
	};

	const getAllJsonPaths = (obj, parentKey = "") => {
		let paths = [];
		for (let key in obj) {
			let currentPath = parentKey ? parentKey + "." + key : key;
			if (typeof obj[key] === "object" && obj[key] !== null) {
				paths = paths.concat(getAllJsonPaths(obj[key], currentPath));
			} else {
				paths.push(`$.${currentPath}`);
			}
		}
		return paths;
	};

	const generateOptions = () => {
		let array = globalStore.globalVars.map((variable) => variable.key);
		return [...array, ...getAllJsonPaths(getLastNodeResponse(state.selectedApi.id))];
	};

	const handleCloseNotification = () => {
		setState((prevState) => ({
			...prevState,
			showToast: false,
			toastType: "",
			toastMsg: ""
		}));
	};

	const handleEditorDidMount = (editor, monaco) => {
		monaco.editor.setTheme("default");
	};

	let isResponsePresent =
		state.selectedApi && state.selectedApi?.responseData && Object.keys(state.selectedApi?.responseData).length === 0;
	return (
		<div className="apiChain">
			{state.showToast && (
				<ToastNotification
					aria-label="closes notification"
					role="alert"
					statusIconDescription="notification"
					subtitle={state.toastMsg}
					title={state.toastType}
					kind={state.toastType}
					timeout={15000}
					onClose={handleCloseNotification}
					className="apiChainNotification"
				/>
			)}
			<div className="apiChain-title">
				<Breadcrumb noTrailingSlash>
					<BreadcrumbItem href="#">
						<div
							className="requestNameText"
							contentEditable={true}
							suppressContentEditableWarning={true}
							id={`requestName-${props.requestData.id}`}
							onBlur={handleRequestName}
						>
							{props.requestData.name}
						</div>
					</BreadcrumbItem>
				</Breadcrumb>
			</div>
			<div
				className="apiChain-playground"
				id="playground"
				draggable={true}
				onDrop={handleDrop}
				onDragOver={handleOnDragOver}
			>
				<div
					className="playground-wrapper"
					onScroll={updateXarrow}
				>
					<Xwrapper>
						{props.requestData?.chain.map((api) => {
							return (
								<DraggableApi
									onDragStart={handleOnDragStartForApi}
									onDragEnd={handleOnDragEndForApi}
									onDrag={handleOnDragForApi}
									onDrop={handleDropForApi}
									handleSetReponseJsonPath={handleSetReponseJsonPath}
									api={getById(api.id)}
									chainApi={api}
									handleRemoveApiFromChain={handleRemoveApiFromChain}
								/>
							);
						})}

						{props.requestData?.chain.length === 0 && (
							<div className="cds--label apiChainPlaceholder">
								{" "}
								Drag drop APIs from Collections view here to create a API Chain{" "}
							</div>
						)}

						{props.requestData.chainMap?.map((arrow) => (
							<Xarrow
								color="#0f62fe"
								strokeWidth={1.5}
								path="grid"
								curveness={0.9}
								labels={{
									middle: arrow.isSelected ? (
										<div className="arrow-label cds--label">
											<Button
												className="arrowLinkDeleteBtn"
												onClick={() => handleDeleteArrow(arrow)}
												size="sm"
												kind="ghost"
												hasIconOnly
												iconDescription="Remove this link"
												renderIcon={() => <TrashCan size="16" />}
											/>
										</div>
									) : (
										""
									)
								}}
								start={`node-${arrow.from}`}
								tailShape={"circle"}
								end={`node-${arrow.to}`}
								passProps={{ onClick: () => handleArrowClick(arrow) }}
							/>
						))}

						{state.isArrowDragging && (
							<>
								<Xarrow
									color="#0f62fe"
									strokeWidth={2}
									start={`node-${currentArrowRef.current}`}
									end={draggingArrowRef}
									path="grid"
									tailShape={"circle"}
								/>
							</>
						)}
						<div
							ref={draggingArrowRef}
							id="draggingArrow"
						></div>
					</Xwrapper>
				</div>
			</div>
			<div className="apiChain-execution">
				<Button
					onClick={handleExecuteChain}
					disabled={state.isChainExecuting}
					renderIcon={state.isChainExecuting ? InlineLoading : ExecutableProgram}
				>
					Execute chain
				</Button>
			</div>
			{state.isJsonPathModalOpen && (
				<Modal
					size="sm"
					open={state.isJsonPathModalOpen}
					modalHeading={
						state.showResponse
							? `${state.selectedApi.name}: JSON Preview`
							: `${state.selectedApi.name}: Enter json path to chain`
					}
					primaryButtonText="Save"
					secondaryButtonText="Cancel"
					onRequestClose={handleCloseJsonPathModal}
					onRequestSubmit={handleSelectJsonPath}
				>
					<div>
						{state.showResponse && (
							<Editor
								height="55vh"
								options={{ lineNumbers: true, minimap: { enabled: false }, readOnly: true }}
								defaultLanguage="json"
								defaultValue={JSON.stringify(state.selectedApi.responseData, null, 3) || ""}
								onMount={handleEditorDidMount}
							/>
						)}
						{!state.showResponse && (
							<Tabs>
								<TabList aria-label="List of tabs">
									<Tab>Last node response</Tab>
									<Tab>Query parameters</Tab>
									<Tab>Headers</Tab>
									<Tab>Request body</Tab>
								</TabList>
								<TabPanels>
									<TabPanel>
										{!isResponsePresent && (
											<Editor
												height="55vh"
												options={{ lineNumbers: true, minimap: { enabled: false }, readOnly: true }}
												defaultLanguage="json"
												defaultValue={JSON.stringify(getLastNodeResponse(state.selectedApi.id), null, 3) || ""}
												onMount={handleEditorDidMount}
											/>
										)}
									</TabPanel>
									<TabPanel className="apiChain-params">
										<div className="cds--label">Enter overrides here (key: JSON path)</div>
										<TextInput
											className="jsonPath-textArea"
											labelText="Enter overrides here (key: JSON path)"
											id={`jsonPath-queryParams-${state.selectedApi.id}`}
											size="lg"
											onBlur={(evt) => handleTextAreaChange(evt.target.value, "queryParams", state.selectedApi)}
											defaultValue={getDefaultValues("queryParams")}
											spacer="}}"
											placeholder={
												"If last node response was {'address': {'city': 'NY'}}, then the JSON path of 'city' is \nkey: $.address.city"
											}
											trigger={["{{"]}
											options={generateOptions()}
										/>
									</TabPanel>
									<TabPanel className="apiChain-params">
										<TextInput
											className="jsonPath-textArea"
											labelText="Enter overrides here (key: JSON path)"
											id={`jsonPath-queryParams-${state.selectedApi.id}`}
											size="lg"
											onBlur={(evt) => handleTextAreaChange(evt.target.value, "headers", state.selectedApi)}
											defaultValue={getDefaultValues("headers")}
											spacer="}}"
											placeholder={
												"If last node response was {'address': {'city': 'NY'}}, then the JSON path of 'city' is \nkey: $.address.city"
											}
											trigger={["{{"]}
											options={generateOptions()}
											multiline
											rows={10}
										/>
									</TabPanel>
									<TabPanel>
										<Dropdown
											id="default"
											titleText="Request type"
											helperText="Please select the request type"
											initialSelectedItem={items.find((itm) => itm.id === state.selectedApi.reqBodyType)}
											label="Select an option"
											items={items}
											itemToString={(item) => (item ? item.text : "")}
											onChange={(value) => handleRequestBodyTypeChange(value)}
										/>
										<TextArea
											labelText="Enter overrides here (key: JSON path)"
											id={`jsonPath-reqBody-${state.selectedApi.id}`}
											placeholder={
												"If last node response was {'address': {'city': 'NY'}}, then the JSON path of 'city' is \nkey: $.address.city"
											}
											onBlur={(evt) => handleTextAreaChange(evt, "reqBody", state.selectedApi)}
											defaultValue={`${getDefaultValues("reqBody")}`}
											multiline
											rows={10}
										/>
									</TabPanel>
								</TabPanels>
							</Tabs>
						)}
					</div>
				</Modal>
			)}
		</div>
	);
}

export default ApiChain;
