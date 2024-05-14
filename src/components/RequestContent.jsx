/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useState, useEffect } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	CodeSnippet,
	Dropdown,
	Button,
	Tabs,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	Tag,
	ToastNotification,
	InlineLoading,
	DangerButton,
	CopyButton
} from "@carbon/react";
import { Send, Close, Copy, Checkmark } from "@carbon/react/icons";
import { GlobalStore } from "../contexts/GlobalContext";
import httpMethods from "../assets/http-methods.json";
import axios from "axios";
import TextInput from "react-autocomplete-input";
import { CommonUtil } from "./CommonUtil";
import { debounce } from "../hooks/debounce";
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

var abortController = new AbortController();
var cancelTokenSource = axios.CancelToken.source();

function RequestContent(props) {
	const { globalStore, updateItemById, getById, findAndAddCertsForEndpoint } = useContext(GlobalStore);

	const [queryParams, setQueryParams] = useState("");
	const [headers, setHeaders] = useState();
	const [headersInput, setHeadersInput] = useState("");
	const [requestBody, setRequestBody] = useState("");
	const [invalidRequestBody, setInvalidRequestBody] = useState(false);
	const [endpoint, setEndpoint] = useState(props.requestData.endpoint);
	const [isEndpointValid, setIsEndpointValid] = useState(0);
	const [isApiLoading, setIsApiLoading] = useState(false);
	const [requestBodyType, setRequestBodyType] = useState();
	const [codeSnippetValue, setCodeSnippetValue] = useState();
	const [codeSnippetType, setCodeSnippetType] = useState({ id: "curl", text: "cURL" });
	const [notificationState, setNotificationState] = useState({
		showToast: false,
		toastMsg: "",
		toastType: ""
	});

	const codeSnippetItems = [
		{ id: "curl", text: "cURL" },
		{ id: "nodeAxios", text: "NodeJs - Axios", disabled: true },
		{ id: "jsFetch", text: "JavaScript - Fetch", disabled: true }
	];
	const items = [
		{ id: "json", text: "json" },
		{ id: "urlencoded", text: "x-www-form-urlencoded" }
	];
	const reqBodyTypeMap = {
		json: 0,
		urlencoded: 1
	};

	const debounceHook = debounce(headers, 500);

	const createAbortController = () => {
		return {
			abortController: new AbortController(),
			cancelTokenSource: axios.CancelToken.source()
		};
	};

	/**
	 * Any change in global store will update the
	 * following useEffect where in `globalStore`
	 * object we will get the updated data
	 *
	 * Similary we can update global store data
	 * so that all other components get the
	 * updated data
	 */
	useEffect(() => {
		let data = getById(props.requestData.id);
		if (data.headers && Object.keys(data.headers).length > 0) {
			setHeadersInput(JsonToFormattedHeaderString(data.headers));
			setHeaders(data.headers);
		} else {
			setHeadersInput("");
			setHeaders();
		}

		setEndpoint(data.endpoint || "");
		if (data.reqBody) {
			setRequestBody(JSON.stringify(data.reqBody, null, 2));
			if (data.reqBodyType === "json") {
				setRequestBody(JSON.stringify(data.reqBody, null, 2));
			} else if (data.reqBodyType === "urlencoded") {
				setRequestBody(data.reqBody);
			}
		} else {
			setRequestBody("");
		}
		const index = reqBodyTypeMap[data.reqBodyType] || 0;
		setRequestBodyType(items[index]);
	}, [props.requestData.id]);

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

	useEffect(() => {
		// For now generate only curl command
		const output = generateCurlCommand(props.requestData);
		setCodeSnippetValue(output);
	}, [globalStore]);

	const generateCurlCommand = (request) => {
		let endpoint = request.endpoint;
		let replacedEndpoint = CommonUtil.runReplacements(request.endpoint, "endpoint", globalStore);
		if (replacedEndpoint.flag) {
			endpoint = replacedEndpoint.text;
		}
		let curlCommand = `curl --location --request ${request.method} '${endpoint}'`;

		// Add headers
		let header = headers;
		let replacedHeaders = CommonUtil.runReplacements(headers || {}, "headers", globalStore);
		if (replacedHeaders.flag) {
			header = replacedHeaders.text;
		}
		if (header) {
			Object.keys(header).forEach((key) => {
				curlCommand += ` --header '${key}: ${header[key]}'`;
			});
		}

		// Add request body
		if (requestBodyType?.id === "json" && requestBody) {
			let reqData = JSON.parse(requestBody);
			let replacedReqBody = CommonUtil.runReplacements(reqData, "requestBodyObj", globalStore);
			if (replacedReqBody.flag) {
				reqData = replacedReqBody.text;
			}
			curlCommand += ` --data '${JSON.stringify(reqData)}'`;
		} else if (requestBodyType?.id === "urlencoded" && requestBody) {
			let reqData = requestBody;
			let replacedReqBody = CommonUtil.runReplacements(requestBody, "requestBodyString", globalStore);
			if (replacedReqBody.flag) {
				reqData = replacedReqBody.text;
			}
			curlCommand += ` --data-urlencode '${reqData}'`;
		}

		return curlCommand;
	};

	useEffect(() => {
		// Function to extract query parameters from endpoint
		const extractQueryParams = (endpointValue) => {
			if (endpointValue) {
				const endpointParts = endpointValue.split("?");
				if (endpointParts.length === 2) {
					const queryParamsString = endpointParts[1];
					const queryParamsArray = queryParamsString.split("&");
					const queryParamsFormatted = queryParamsArray.map((param) => param.replace("=", ":")).join("\n");
					return queryParamsFormatted;
				}
			}
			return "";
		};

		// Extract query parameters from the endpoint and set in the queryParams state
		const queryParamsFromEndpoint = extractQueryParams(endpoint);
		setQueryParams(queryParamsFromEndpoint);
		handleEndpointChange(endpoint, queryParamsFromEndpoint, false);
	}, [endpoint]);

	const updateEndpointFromQueryParams = (queryParamsValue) => {
		// Function to update endpoint based on queryParams
		const queryParamsArray = queryParamsValue
			.split("\n")
			.map((param) => param.trim())
			.filter((param) => param !== "")
			.map((param) => param.replace(":", "="));

		const queryParamsString = queryParamsArray.join("&");

		const endpointParts = endpoint.split("?");
		const existingEndpointBeforeQuery = endpointParts[0];

		if (queryParamsString) {
			const newEndpoint = `${existingEndpointBeforeQuery}?${queryParamsString}`;
			setEndpoint(newEndpoint);
		} else {
			setEndpoint(existingEndpointBeforeQuery);
		}
	};

	// Handle changes in the queryParams field
	const handleQueryParamChange = (e) => {
		setQueryParams(e);
		// Update the endpoint when query parameters change
		updateEndpointFromQueryParams(e);
	};

	// Handle changes in the endpoint field
	const handleEndpointChange = (value, queryparam, updateState) => {
		updateItemById(props.requestData.id, ["endpoint", "queryParams"], [value, queryparam]);
		if (updateState) {
			setEndpoint(value);
			validateEndpoint(value);
		}
	};

	const validateEndpoint = (endpoint) => {
		if (endpoint) {
			setIsEndpointValid(1);
			return true;
		} else {
			setIsEndpointValid(-1);
			return false;
		}
	};

	const handleRequestBodyChange = (value) => {
		setRequestBody(value);
	};

	const updateRequestBody = (inputType) => {
		try {
			var type = inputType;
			if (inputType !== "urlencoded" && inputType !== "json") {
				type = requestBodyType?.id;
			}
			var parsedRequestBody = "";
			if (type === "urlencoded") {
				parsedRequestBody = requestBody;
				setRequestBody(requestBody.toString());
			} else if (type === "json" && requestBody !== "{}" && requestBody !== "" && requestBody !== undefined) {
				const output = requestBody.replace(/{{(.*?)}}(?!")/g, '"{{$1}}"');
				parsedRequestBody = JSON.parse(output);
				setRequestBody(JSON.stringify(parsedRequestBody, null, 2));
			}

			if (typeof inputType === "object") {
				// If inputType is object, update the reqBody
				updateItemById(props.requestData.id, "reqBody", parsedRequestBody);
			}

			setInvalidRequestBody(false);
		} catch (error) {
			console.error("Error parsing JSON:", error);
			setInvalidRequestBody(true);
		}
	};

	const handleHeadersChange = (value) => {
		setHeadersInput(value);

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

		setHeaders(headersObject);
	};

	useEffect(() => {
		updateItemById(props.requestData.id, "headers", headers);
	}, [debounceHook]);

	function JsonToFormattedHeaderString(json) {
		// Check if json is non-empty and an object
		if (typeof json !== "object" || Object.keys(json).length === 0) {
			return "";
		}

		// Map the JSON object into an array of strings in the "key: value" format
		const formattedStrings = Object.entries(json).map(([key, value]) => {
			return `${key}: ${value}`;
		});

		// Join the array of formatted strings with newlines
		const formattedText = formattedStrings.join("\n");

		return formattedText;
	}

	const saveApiResponse = (data, statusText, statusCode, executionTime, responseSize, responseHeader) => {
		updateItemById(
			props.requestData.id,
			["responseData", "responseStatusText", "responseStatusCode", "executionTime", "responseSize", "responseHeader"],
			[data, statusText, statusCode, executionTime, responseSize, responseHeader]
		);
	};

	const handleCloseNotification = () => {
		setNotificationState((prevState) => ({
			...prevState,
			showToast: false,
			toastType: "",
			toastMsg: ""
		}));
	};

	const sendRequest = () => {
		// Do not send request if an invalid endpoint is provided
		if (!validateEndpoint(props.requestData.endpoint) || invalidRequestBody) {
			return;
		}

		let request = new Object();
		request.method = props.requestData.method.toLowerCase();

		/**
		 * Resolve {{template}} environment
		 * variables for endpoint url
		 */
		let replacedEndpoint = CommonUtil.runReplacements(props.requestData.endpoint, "endpoint", globalStore);
		if (replacedEndpoint.flag) {
			props.requestData.endpoint = replacedEndpoint.text;
		} else {
			setNotificationState({
				showToast: true,
				toastType: "error",
				toastMsg: `{{${replacedEndpoint.text}}} referenced in 'Endpoint url' not found in Settings > environment variables`
			});
			return;
		}

		/**
		 * Resolve {{template}} environment
		 * variables for headers
		 */
		let replacedHeaders = CommonUtil.runReplacements(props.requestData.headers || {}, "headers", globalStore);
		if (replacedHeaders.flag) {
			props.requestData.headers = replacedHeaders.text;
		} else {
			setNotificationState({
				showToast: true,
				toastType: "error",
				toastMsg: `{{${replacedEndpoint.text}}} referenced in 'Headers' was not found in Settings > environment variables`
			});
			return;
		}

		let replacedReqBody = CommonUtil.runReplacements(
			props.requestData.reqBody,
			requestBodyType?.id == "urlencoded" ? "requestBodyString" : "requestBodyObj",
			globalStore
		);
		if (replacedReqBody.flag) {
			props.requestData.reqBody = replacedReqBody.text;
		} else {
			setNotificationState({
				showToast: true,
				toastType: "error",
				toastMsg: `{{${replacedEndpoint.text}}} referenced in 'Request body' was not found in Settings > environment variables`
			});
			return;
		}
		if (!(props.requestData.endpoint.startsWith("http://") || props.requestData.endpoint.startsWith("https://"))) {
			// Verify if protocol is provided in endpoint. Add default if missing
			request.url = "https://" + props.requestData.endpoint;
		} else {
			request.url = props.requestData.endpoint;
		}

		request.headers = props.requestData.headers ? props.requestData.headers : {};
		request.reqBody = props.requestData.reqBody ? props.requestData.reqBody : {};
		request.reqBodyType = props.requestData.reqBodyType ? props.requestData.reqBodyType : "";
		setIsApiLoading(true);
		props.requestData.responseSize = "";
		props.requestData.executionTime = "";
		props.requestData.responseStatusCode = undefined;

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

		axios({
			method: "post",
			url: `${serverURL}/proxy`,
			data: JSON.parse(JSON.stringify(request)),
			cancelToken: cancelTokenSource.token,
			signal: abortController.signal
		})
			.then(function (response) {
				let responseHeader = response.data.responseHeaders;
				response = response.data;

				saveApiResponse(
					response.data.message,
					response.data.status,
					response.data.statusCode,
					response.executionTime,
					response.responseSize,
					responseHeader
				);
				setIsApiLoading(false);
			})
			.catch(function (error) {
				console.log(error);
				if (error.response) {
					let executionTime, responseSize;
					if (error.response.data) {
						executionTime = error.response.data["executionTime"];
						responseSize = error.response.data["responseSize"];
						error.response.data["executionTime"] = undefined;
						error.response.data["responseSize"] = undefined;
					}

					saveApiResponse(
						error.response.data,
						error.response.statusText,
						error.response.status,
						executionTime,
						responseSize,
						error.response.headers
					);
				}

				if (error.code === "ERR_NETWORK") {
					saveApiResponse({ message: error.message + ", Echo server unreachable" }, "ERR_NETWORK", "", "", "", "");
				}
				setIsApiLoading(false);
			});
	};

	const cancelRequest = () => {
		abortController.abort();
		cancelTokenSource.cancel();
		setIsApiLoading(false);
		({ abortController, cancelTokenSource } = createAbortController());
	};

	const onMethodChange = (data) => {
		updateItemById(props.requestData.id, "method", data.selectedItem.id);
	};

	const getColorScheme = (code) => {
		if (code === 200 || code === 201 || code === 202 || code === 204) return "green";
		if (code >= 300 && code < 400) return "teal";
		if (code >= 400 && code < 500) return "red";
		if (code >= 500 && code < 600) return "red";
		return "grey";
	};

	const copyResponseToClipboard = () => {
		let response = props.requestData.responseData;
		navigator.clipboard.writeText(JSON.stringify(response, undefined, 2));
	};

	const handleRequestBodyTypeChange = (value) => {
		setRequestBodyType(value.selectedItem);
		updateItemById(props.requestData.id, "reqBodyType", value.selectedItem.id);
		updateRequestBody(value.selectedItem.id);
	};

	const handleCodeSnippetTypeChange = (value) => {
		setCodeSnippetType(value.selectedItem);
	};

	const handleEndpointFocus = (evt) => {
		console.log("evt.target.scrollWidth > evt.target.clientWidth -- ", evt.target.scrollWidth > evt.target.clientWidth);
		if (evt.target.scrollWidth > evt.target.clientWidth) {
			document.querySelector(`[name=api-endpoint-${props.requestData.id}]`).style.height = "90px !important";
		}
	};

	const handleEditorDidMount = (editor, monaco) => {
		monaco.editor.setTheme("default");
	};

	return (
		<div>
			{notificationState.showToast && (
				<ToastNotification
					aria-label="closes notification"
					role="alert"
					statusIconDescription="notification"
					subtitle={notificationState.toastMsg}
					title={notificationState.toastType}
					kind={notificationState.toastType}
					timeout={5000}
					onClose={handleCloseNotification}
					className="apiChainNotification"
				/>
			)}
			<div className="tool-requestTitleBar">
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
			<div className="tool-inputBar">
				<div className="tool-inputMethod">
					<Dropdown
						id="http-method"
						size="lg"
						className="test-class"
						invalidText="Error message that is really long can wrap to more lines but should not be excessively long."
						itemToString={(item) => (item ? item.displayText : "")}
						items={httpMethods.methods}
						selectedItem={{ id: props.requestData.method, displayText: props.requestData.method }}
						titleText=""
						hideLabel
						onChange={onMethodChange}
						warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
					/>
				</div>
				<div className="tool-inputText">
					<div id="tooltip"></div>
					<TextInput
						className="cds--text-input"
						id="api-endpoint"
						name={`api-endpoint-${props.requestData.id}`}
						labelText="Endpoint"
						size="lg"
						onChange={(e) => handleEndpointChange(e, "", true)}
						onBlur={(e) => validateEndpoint(e)}
						onFocus={handleEndpointFocus}
						value={endpoint}
						spacer="}}"
						invalid={isEndpointValid === -1}
						style={{
							outline: isEndpointValid === -1 ? "2px solid var(--cds-support-error, #da1e28)" : null,
							borderBottom: isEndpointValid === -1 ? "unset" : null
						}}
						placeholder="Enter URL"
						trigger={["{{"]}
						rows={1}
						options={globalStore.globalVars.map((variable) => variable.key)}
					/>
				</div>
				<div className="tool-inputSubmit">
					{!isApiLoading && (
						<Button
							className="requestContent-sendBtn"
							size="lg"
							id={`sendBtn-${props.requestData.id}`}
							disabled={isApiLoading}
							onClick={sendRequest}
							renderIcon={Send}
						>
							Send
						</Button>
					)}
					{isApiLoading && (
						<DangerButton
							className="requestContent-sendBtn"
							size="lg"
							onClick={cancelRequest}
							renderIcon={Close}
						>
							Cancel
						</DangerButton>
					)}
				</div>
			</div>
			<div className="tool-requestControls">
				<div className="tool-restOptions">
					<Tabs>
						<TabList aria-label="List of tabs">
							<Tab>Query parameters</Tab>
							<Tab>Headers</Tab>
							<Tab>Request body</Tab>
							<Tab>Code snippet</Tab>
						</TabList>
						<TabPanels>
							<TabPanel className="requestContent-params">
								{/* Query Parameters Section */}
								<TextInput
									id="queryParams"
									labelText="Query Parameters"
									size="lg"
									onChange={handleQueryParamChange}
									value={queryParams}
									spacer="}}"
									rows={5}
									placeholder={"pageSize: 10\npageNumber: 2\n_namedQuery: findById"}
									trigger={["{{"]}
									options={globalStore.globalVars.map((variable) => variable.key)}
								/>
							</TabPanel>
							<TabPanel>
								{/* Headers Section */}
								<TextInput
									id="headers"
									labelText="Headers"
									size="lg"
									onChange={handleHeadersChange}
									value={headersInput}
									spacer="}}"
									rows={5}
									placeholder={`X-Custom-Header: foobar\nX-Transaction-Id: 449927e5-518e-42a0-825b-a05296aeb886`}
									trigger={["{{"]}
									options={globalStore.globalVars.map((variable) => variable.key)}
								/>
							</TabPanel>
							<TabPanel>
								{/* Request Body Section */}
								<Dropdown
									id="default"
									titleText="Request type"
									helperText="Please select the request type"
									selectedItem={requestBodyType}
									label="Select an option"
									items={items}
									itemToString={(item) => (item ? item.text : "")}
									onChange={(value) => handleRequestBodyTypeChange(value)}
								/>
								<br />
								<TextInput
									id="requestBody"
									labelText="Request Body"
									size="lg"
									onChange={(e) => handleRequestBodyChange(e, true)}
									value={requestBody}
									onBlur={updateRequestBody}
									spacer="}}"
									rows={10}
									placeholder={`Provide the request body to be sent`}
									style={{
										height: "unset",
										outline: invalidRequestBody ? "2px solid var(--cds-support-error, #da1e28)" : null,
										borderBottom: invalidRequestBody ? "unset" : null
									}}
									trigger={["{{"]}
									isRequestBodyValid
									options={globalStore.globalVars.map((variable) => variable.key)}
								/>
								{invalidRequestBody && (
									<div className="requestBodyErrorMessage">{`Invalid data format. Please check your input.`}</div>
								)}
							</TabPanel>
							<TabPanel>
								<Dropdown
									id="default"
									selectedItem={codeSnippetType}
									label="Select an option"
									items={codeSnippetItems}
									itemToString={(item) => (item ? item.text : "")}
									onChange={(value) => handleCodeSnippetTypeChange(value)}
								/>
								<br />
								<CodeSnippet
									type="multi"
									feedback="Copied to clipboard"
									minCollapsedNumberOfRows={20}
									maxExpandedNumberOfRows={15}
									wrapText
								>
									{codeSnippetValue}
								</CodeSnippet>
							</TabPanel>
						</TabPanels>
					</Tabs>
				</div>
				<div className="tool-restResponse">
					<Tabs>
						<TabList aria-label="List of tabs">
							<Tab>
								Response data{" "}
								{props.requestData.responseData && (
									<>
										{props.requestData?.responseStatusCode && (
											<Tag
												type={getColorScheme(props.requestData?.responseStatusCode)}
											>{`${props.requestData?.responseStatusCode} ${props.requestData?.responseStatusText}`}</Tag>
										)}
										<span className="tool-reponseMetricSpan">{props.requestData?.executionTime}</span>
										<span className="tool-reponseMetricSpan">{props.requestData?.responseSize}</span>
									</>
								)}
							</Tab>
							<Tab>Response headers</Tab>
							<CopyButton
								align="left"
								onClick={copyResponseToClipboard}
							/>
						</TabList>
						<TabPanels>
							<TabPanel>
								{isApiLoading && (
									<InlineLoading
										status="active"
										iconDescription="Loading"
										description="Executing API..."
									/>
								)}

								{!isApiLoading && (
									<div style={{ display: "flex", verticalAlign: "top" }}>
										<div
											style={{ flex: "9" }}
											id="editor"
										>
											<Editor
												height="55vh"
												options={{
													lineNumbers: true,
													minimap: { enabled: false },
													readOnly: true,
													wordWrap: true
												}}
												theme="default"
												defaultLanguage="json"
												defaultValue={JSON.stringify(props.requestData.responseData, null, 3) || ""}
												onMount={handleEditorDidMount}
											/>
										</div>
									</div>
								)}
							</TabPanel>
							<TabPanel>
								{isApiLoading && (
									<InlineLoading
										status="active"
										iconDescription="Loading"
										description="Executing API..."
									/>
								)}
								{!isApiLoading && (
									<Editor
										height="55vh"
										options={{ lineNumbers: false, minimap: { enabled: false }, readOnly: true }}
										defaultLanguage="json"
										defaultValue={JSON.stringify(props.requestData.responseHeader, null, 3) || ""}
										onMount={handleEditorDidMount}
									/>
								)}
							</TabPanel>
						</TabPanels>
					</Tabs>
				</div>
			</div>
		</div>
	);
}

export default RequestContent;
