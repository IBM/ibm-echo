import React, { useContext } from "react";
import { Modal, Tabs, TabList, Tab, TabPanels, TabPanel, Dropdown } from "@carbon/react";
import Editor, { loader } from "@monaco-editor/react";
import { GlobalStore } from "../contexts/GlobalContext";
import PureTextInput from "./PureTextInput";
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

function NodeParametersModal(props) {
	const { getChainItemById, updateChainItemById, globalStore } = useContext(GlobalStore);

	const updateNodeValues = (id, type, value) => {
		if (type === "headers") {
			updateChainItemById(props.requestData.id, id, type, props.convertStringToObj(value));
		} else if (type === "queryParams") {
			updateChainItemById(props.requestData.id, id, type, props.convertStringToObj(value));
		} else if (type === "reqBody" && props.selectedApi.reqBodyType !== "urlencoded") {
			try {
				value = value.replace(/(?<!"){{(?!")([^{}]+)}}(?!")/g, '"{{$1}}"');
				updateChainItemById(props.requestData.id, id, type, JSON.parse(value));
			} catch (err) {
				updateChainItemById(props.requestData.id, id, type, value);
			}
		} else if (type === "reqBody" && props.selectedApi.reqBodyType === "urlencoded") {
			updateChainItemById(props.requestData.id, id, type, value);
		} else if (type === "endpoint") {
			updateChainItemById(props.requestData.id, id, type, value);
		}
	};

	const generateOptions = () => {
		let array = globalStore.globalVars.map((variable) => variable.key);
		return [...array, ...getAllJsonPaths(props.getLastNodeResponse(props.selectedApi.id))];
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

	const getDefaultValues = (type) => {
		if (!props.selectedApi) return "";
		let obj = getChainItemById(props.requestData.id, props.selectedApi.id);
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

		if (type === "reqBody" && obj.reqBodyType === "json") {
			return typeof obj.reqBody === "object" ? JSON.stringify(obj.reqBody, null, 4) : obj.reqBody;
		}

		if (type === "endpoint") {
			return obj.endpoint;
		}
	};

	const handleRequestBodyTypeChange = (value) => {
		updateChainItemById(props.requestData.id, props.selectedApi.id, "reqBodyType", value.selectedItem.id);
	};

	const handleEditorDidMount = (editor, monaco) => {
		monaco.editor.setTheme("default");
	};

	let isResponsePresent =
		props.selectedApi && props.selectedApi?.responseData && Object.keys(props.selectedApi?.responseData).length === 0;

	return (
		<Modal
			size="sm"
			preventCloseOnClickOutside={true}
			open={true}
			modalHeading={
				props.showResponse
					? `${props.selectedApi.name}: JSON Preview`
					: `${props.selectedApi.name}: Enter json path to chain`
			}
			primaryButtonText="Save"
			secondaryButtonText="Cancel"
			onRequestClose={props.handleCloseJsonPathModal}
			onRequestSubmit={props.handleSelectJsonPath}
		>
			<div>
				{props.showResponse && (
					<Editor
						height="55vh"
						options={{ lineNumbers: true, wordWrap: true, minimap: { enabled: false }, readOnly: true }}
						defaultLanguage="json"
						defaultValue={JSON.stringify(props.selectedApi.responseData, null, 3) || ""}
						onMount={handleEditorDidMount}
					/>
				)}
				{!props.showResponse && (
					<Tabs>
						<div className="tool-inputText node-parameters-inputText">
							<div className="cds--label">Endpoint</div>

							<PureTextInput
								className="cds--text-input node-parameters-modal"
								options={generateOptions()}
								domId={`api-endpoint`}
								changeHandler={updateNodeValues}
								defaultValue={getDefaultValues("endpoint")}
								type="endpoint"
								id={props.selectedApi.id}
							/>
						</div>

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
										options={{ lineNumbers: true, wordWrap: true, minimap: { enabled: false }, readOnly: true }}
										defaultLanguage="json"
										defaultValue={JSON.stringify(props.getLastNodeResponse(props.selectedApi.id), null, 3) || ""}
										onMount={handleEditorDidMount}
									/>
								)}
							</TabPanel>
							<TabPanel className="apiChain-params">
								<div className="cds--label">Enter overrides here (key: JSON path)</div>
								<PureTextInput
									className="jsonPath-textArea"
									options={generateOptions()}
									domId={`jsonPath-queryParams-${props.selectedApi.id}`}
									id={props.selectedApi.id}
									changeHandler={updateNodeValues}
									defaultValue={getDefaultValues("queryParams")}
									type="queryParams"
								/>
							</TabPanel>
							<TabPanel className="apiChain-params">
								<PureTextInput
									className="jsonPath-textArea"
									options={generateOptions()}
									domId={`jsonPath-headers-${props.selectedApi.id}`}
									id={props.selectedApi.id}
									changeHandler={updateNodeValues}
									defaultValue={getDefaultValues("headers")}
									type="headers"
								/>
							</TabPanel>
							<TabPanel className="apiChain-params">
								<Dropdown
									id="default"
									titleText="Request type"
									helperText="Please select the request type"
									initialSelectedItem={items.find((itm) => itm.id === props.selectedApi.reqBodyType)}
									label="Select an option"
									items={items}
									itemToString={(item) => (item ? item.text : "")}
									onChange={(value) => handleRequestBodyTypeChange(value)}
								/>

								<PureTextInput
									className="jsonPath-textArea"
									options={generateOptions()}
									domId={`jsonPath-reqBody-${props.selectedApi.id}`}
									id={props.selectedApi.id}
									changeHandler={updateNodeValues}
									defaultValue={getDefaultValues("reqBody")}
									type="reqBody"
								/>
							</TabPanel>
						</TabPanels>
					</Tabs>
				)}
			</div>
		</Modal>
	);
}

export default NodeParametersModal;
