import { flushSync } from "react-dom";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdef", 10);
import { createContext } from "react";

/**
 * Request Schema for reference about total fields
 */
const Schema = {
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

/**
 * GlobalStore is the context where we store all the
 * 1. Collections/ API Groups
 * 2. Environment variables
 * 3. Certificates
 */
export const GlobalStore = createContext({});
export function GlobalContextProvider(props) {
	const isAPIGroupMountedRef = useRef();
	const isCertifactesRef = useRef();
	const isEnvVaraiblesRef = useRef();
	const [state, setState] = useState({
		apis: [], // Collections/ API Groups
		globalVars: [], // Environment variables
		certificates: [], // Certificates
		selectedNode: "1",
		encodedUser: "ONLY AVAILABLE IF USER HAD LOGGED IN!",
		user: ""
	});

	/**
	 * Basing upon the environment,
	 * Desktop app (MacOs, Windows) or Webapp
	 * we get the correct server/proxy url
	 */
	let serverURL =
		import.meta.env.VITE_APP_IS_ELECTRON_BUILD === "true"
			? "https://localhost:7857"
			: import.meta.env.VITE_APP_SERVER_URL;

	useEffect(() => {
		/**
		 * On first mount get all localStorage
		 * saved collections/API groups and set it to the state
		 */
		if (!isAPIGroupMountedRef.current) {
			let apis = window.localStorage.getItem("apis") || "[]";
			apis = JSON.parse(apis);
			if (apis && apis.length > 0) {
				setState((prevState) => ({ ...prevState, apis: apis }));
			}
			isAPIGroupMountedRef.current = true;
		} else {
			/**
			 * After initial component mount serialize
			 * all the collections/API groups to the
			 * LocalStorage
			 */
			console.log("Setting localstorage");
			try {
				window.localStorage.setItem("apis", JSON.stringify(state.apis));
			} catch (err) {
				window.alert(err.message);
			}
		}
	}, [state.apis]);

	useEffect(() => {
		/**
		 * On first mount get all localStorage
		 * saved environment variables and set it to the state
		 */
		if (!isEnvVaraiblesRef.current) {
			let vars = window.localStorage.getItem("globalVars") || "[]";
			vars = JSON.parse(vars);
			if (vars.length > 0) {
				setState((prevState) => ({ ...prevState, globalVars: vars }));
			}
			isEnvVaraiblesRef.current = true;
		} else {
			/**
			 * After initial component mount serialize
			 * all the environment variables to the
			 * LocalStorage
			 */
			try {
				window.localStorage.setItem("globalVars", JSON.stringify(state.globalVars));
			} catch (err) {
				window.alert(err.message);
			}
		}
	}, [state.globalVars]);

	useEffect(() => {
		/**
		 * On first mount get all localStorage
		 * saved certificates and set it to the state
		 */
		if (!isCertifactesRef.current) {
			let certificates = window.localStorage.getItem("certificates") || "[]";
			certificates = JSON.parse(certificates);
			if (certificates && certificates.length > 0) {
				setState((prevState) => ({ ...prevState, certificates: certificates }));
			}

			isCertifactesRef.current = true;
		} else {
			/**
			 * After initial component mount serialize
			 * all the certificates groups to the
			 * LocalStorage
			 */
			try {
				window.localStorage.setItem("certificates", JSON.stringify(state.certificates));
			} catch (err) {
				window.alert(err.message);
			}
		}
	}, [state.certificates]);

	const sendEvents = (TYPE, data, userList) => {
		axios({
			method: "post",
			url: `${serverURL}/events`,
			headers: { "Content-Type": "application/json" },
			data: JSON.stringify({
				json: {
					TYPE: TYPE,
					data: data
				},
				userList: userList
			})
		}).catch((err) => {
			console.log("sendEvents failed - ", err);
		});
	};

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

	const getChainItemById = (_id, _chainId) => {
		let apis = window.localStorage.getItem("apis") || "[]";
		apis = JSON.parse(apis);
		let chainElem = null;
		const get = (data) => {
			for (let item of data) {
				if (item.id === _id) {
					for (let req of item.chain) {
						if (req.id === _chainId) {
							chainElem = req;
							break;
						}
					}

					break;
				}

				if (item.items) {
					get(item.items);
				}
			}
		};

		get(apis);
		return chainElem;
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
				removeGlobalVariable,
				getChainItemById
			}}
		>
			{props.children}
		</GlobalStore.Provider>
	);
}

export default GlobalContextProvider;
