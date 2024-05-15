/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useState, useRef, useEffect } from "react";
import {
	TextInput,
	DataTable,
	Table,
	TableHead,
	TableContainer,
	TableToolbar,
	TableToolbarContent,
	TableCell,
	TableSelectRow,
	TableRow,
	TableBody,
	TableHeader,
	TableSelectAll,
	Button,
	TableToolbarAction,
	TableToolbarSearch,
	TableToolbarMenu,
	ToastNotification,
	FlexGrid,
	Row,
	Column,
	Breadcrumb,
	BreadcrumbItem,
	ContainedList,
	ContainedListItem,
	InlineLoading
} from "@carbon/react";
import { Play, Stop } from "@carbon/react/icons";
import GlobalContextProvider, { GlobalStore } from "../contexts/GlobalContext";
import axios from "axios";
import { CommonUtil } from "./CommonUtil";

var abortController = new AbortController();
var cancelTokenSource = axios.CancelToken.source();

function RunTest(props) {
	const { globalStore, findAndAddCertsForEndpoint, updateItemById } = useContext(GlobalStore);

	const [requestJson, setRequestJson] = useState([]);
	const [apiResponse, setApiResponse] = useState([]);
	const [iterationValue, setIterationValue] = useState(1);
	const [delayMilliseconds, setDelayMilliseconds] = useState(0);
	const [invalidIteration, setInvalidIteration] = useState(false);
	const [invalidDelay, setInvalidDelay] = useState(false);
	const [testRunning, setTestRunning] = useState(false);
	const [averageTime, setAverageTime] = useState(null);
	const [selectedApiCount, setSelectedApiCount] = useState(null);
	const [notificationState, setNotificationState] = useState({
		showToast: false,
		toastMsg: "",
		toastType: ""
	});

	const stopTest = useRef(false);

	const tableHeaders = [
		{
			header: "API Name",
			key: "name"
		},
		{
			header: "Method",
			key: "method"
		}
	];

	const createAbortController = () => {
		return {
			abortController: new AbortController(),
			cancelTokenSource: axios.CancelToken.source()
		};
	};

	useEffect(() => {
		let storeCopy = JSON.parse(JSON.stringify(globalStore));
		let siblingObjects = [];

		const findAndCollectEndpoints = (items, pass) => {
			for (const item of items) {
				if ((item.type === "runTest" && item.id === props.requestData.id) || pass) {
					siblingObjects = siblingObjects.concat(items.filter((sibling) => sibling.type === "request"));
					// If there are group siblings, recursively collect their endpoints
					items
						.filter((sibling) => sibling.type === "group" && sibling.items)
						.forEach((group) => {
							siblingObjects = siblingObjects.concat(findAndCollectEndpoints(group.items, true));
						});
				}

				if (item.items) {
					findAndCollectEndpoints(item.items, false);
				}
			}
			return siblingObjects;
		};

		const response = findAndCollectEndpoints(storeCopy.apis, false);
		const uniqueArray = response.filter((item, index, self) => self.findIndex((el) => el.id === item.id) === index);
		setRequestJson(uniqueArray);
	}, [globalStore]);

	useEffect(() => {
		const times = apiResponse.map((data) => parseInt(data.time.split(" ")[0]));
		if (times.length > 0) {
			const sum = times.reduce((acc, time) => acc + time, 0);
			const average = sum / times.length;
			setAverageTime(average);
		}
	}, [apiResponse]);

	const handleClick = () => {
		alert("Upcoming feature");
	};

	const clearResults = () => {
		setApiResponse([]);
		setSelectedApiCount(0);
		setAverageTime(null);
	};

	const sendRequest = async (requestData) => {
		return new Promise((resolve, reject) => {
			let request = new Object();
			request.method = requestData.method.toLowerCase();
			/**
			 * Resolve {{template}} environment
			 * variables for endpoint url
			 */
			let replacedEndpoint = CommonUtil.runReplacements(requestData.endpoint, "endpoint", globalStore);
			if (replacedEndpoint.flag) {
				requestData.endpoint = replacedEndpoint.text;
			} else {
				setNotificationState({
					showToast: true,
					toastType: "error",
					toastMsg: `{{${replacedEndpoint.text}}} referenced in 'Endpoint url' not found in Settings > environment variables`
				});
				handleStop();
				return;
			}

			/**
			 * Resolve {{template}} environment
			 * variables for headers
			 */
			let replacedHeaders = CommonUtil.runReplacements(requestData.headers || {}, "headers", globalStore);
			if (replacedHeaders.flag) {
				requestData.headers = replacedHeaders.text;
			} else {
				setNotificationState({
					showToast: true,
					toastType: "error",
					toastMsg: `{{${replacedEndpoint.text}}} referenced in 'Headers' not found in Settings > environment variables`
				});
				handleStop();
				return;
			}

			let replacedReqBody = CommonUtil.runReplacements(
				requestData.reqBody,
				requestData.reqBodyType == "urlencoded" ? "requestBodyString" : "requestBodyObj",
				globalStore
			);
			if (replacedReqBody.flag) {
				requestData.reqBody = replacedReqBody.text;
			} else {
				setNotificationState({
					showToast: true,
					toastType: "error",
					toastMsg: `{{${replacedEndpoint.text}}} referenced in 'Request body' not found in Settings > environment variables`
				});
				handleStop();
				return;
			}

			request.url = requestData.endpoint;
			request.headers = requestData.headers ? requestData.headers : {};
			request.reqBody = requestData.reqBody ? requestData.reqBody : {};
			request.reqBodyType = requestData.reqBodyType ? requestData.reqBodyType : "";
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
					response = response.data;

					let tempObj = {
						statusCode: response.data.statusCode,
						status: response.data.status,
						time: response.executionTime
					};
					resolve(tempObj);
				})
				.catch(function (error) {
					if (error.response) {
						let executionTime;
						if (error.response.data) {
							executionTime = error.response.data["executionTime"];
						}
						let tempObj = {
							statusCode: error.response.status,
							status: error.response.statusText,
							time: executionTime
						};
						resolve(tempObj);
					}

					if (error.code === "ERR_NETWORK") {
						let tempObj = {
							statusCode: "INT ERR",
							status: "INT ERR",
							time: "INT ERR"
						};
						return tempObj;
					}
				});
		});
	};

	const handleStop = () => {
		abortController.abort();
		stopTest.current = true;
		cancelTokenSource.cancel();
		setTestRunning(false);
		({ abortController, cancelTokenSource } = createAbortController());
	};

	const handleRun = async (selectedRows) => {
		setSelectedApiCount(selectedRows.length);
		let filteredResults = [];
		setTestRunning(true);
		stopTest.current = false;
		selectedRows.forEach((rowItem) => {
			let result = requestJson.filter((item) => item.id === rowItem.id);
			filteredResults = filteredResults.concat(result);
		});
		if (filteredResults.length < 1) {
			alert("Please select at least one API");
			setTestRunning(false);
			return;
		}
		for (let i = 0; i < iterationValue; i++) {
			for (let i = 0; i < filteredResults.length; i++) {
				if (stopTest.current) {
					setTestRunning(false);
					return;
				}
				const item = filteredResults[i];
				const response = await sendRequest(item);
				let tempObj = {
					id: item.id,
					method: item.method,
					apiName: item.name,
					statusCode: response.statusCode,
					status: response.status,
					time: response.time
				};
				setApiResponse((prevState) => [...prevState, tempObj]);
				await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
			}
		}
		setTestRunning(false);
	};

	const onchangeIteration = (value) => {
		setIterationValue(value);
		if (/^\d*$/.test(value) && value >= 1 && value <= 100) {
			setInvalidIteration(false);
		} else {
			setInvalidIteration(true);
		}
	};

	const onchangeDelay = (value) => {
		setDelayMilliseconds(value);
		if (/^\d*$/.test(value) && value >= 0) {
			setInvalidDelay(false);
		} else {
			setInvalidDelay(true);
		}
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

	const handleCloseNotification = () => {
		setNotificationState((prevState) => ({
			...prevState,
			showToast: false,
			toastType: "",
			toastMsg: ""
		}));
	};

	const divStyle = {
		height: "80vh",
		overflow: "auto",
		marginLeft: "-5%",
		padding: "2% 2% 2% 2%",
		border: "1px solid #ccc"
	};

	const divTotalApi = {
		position: "absolute",
		left: "2%",
		top: 0,
		fontFamily: "Arial, sans-serif",
		fontSize: "16px",
		color: "#333",
		marginTop: "10px",
		padding: "5px 10px",
		backgroundColor: "#f4f4f4",
		borderRadius: "5px"
	};

	const divAverageTime = {
		position: "absolute",
		right: "2%",
		top: 0,
		fontFamily: "Arial, sans-serif",
		fontSize: "16px",
		color: "#333",
		marginTop: "10px",
		padding: "5px 10px",
		backgroundColor: "#f4f4f4",
		borderRadius: "5px"
	};

	const getColorScheme = (code) => {
		if (code === 200 || code === 201 || code === 202 || code === 204) return "green";
		if (code >= 300 && code < 400) return "teal";
		if (code >= 400 && code < 500) return "red";
		if (code >= 500 && code < 600) return "red";
		return "grey";
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
			<div
				style={{ marginBottom: "1%" }}
				className="tool-requestTitleBar"
			>
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
			<FlexGrid>
				<Row>
					<Column>
						<div
							style={divStyle}
							className="scrollable-div"
						>
							<div>Run configuration</div>
							<br />
							<div style={{ display: "flex", width: "100%", marginBottom: "5%" }}>
								<div style={{ width: "40%" }}>
									<TextInput
										id="run-test-iteration"
										autoComplete="off"
										value={iterationValue}
										labelText={"Iterations"}
										invalid={invalidIteration}
										invalidText={"Please enter a value between 1 to 100"}
										onChange={(e) => onchangeIteration(e.target.value)}
									/>
								</div>
								<br />
								<div style={{ width: "40%", marginLeft: "10%" }}>
									<TextInput
										id="run-test-delay"
										autoComplete="off"
										labelText={"Delay (in milliseconds)"}
										value={delayMilliseconds}
										invalid={invalidDelay}
										invalidText={"Invalid input"}
										onChange={(e) => onchangeDelay(e.target.value)}
									/>
								</div>
							</div>
							<DataTable
								rows={requestJson}
								headers={tableHeaders}
								size="md"
								render={({
									rows,
									headers,
									getHeaderProps,
									getRowProps,
									getSelectionProps,
									getBatchActionProps,
									onInputChange,
									selectedRows
								}) => (
									<TableContainer title={"Run test"}>
										<TableToolbar>
											<TableToolbarContent style={{ marginBottom: "2%" }}>
												<TableToolbarSearch
													tabIndex={getBatchActionProps().shouldShowBatchActions ? -1 : 0}
													onChange={onInputChange}
												/>
												<TableToolbarMenu tabIndex={getBatchActionProps().shouldShowBatchActions ? -1 : 0}>
													<TableToolbarAction
														primaryFocus
														onClick={() => alert("Upcoming feature")}
													>
														Export
													</TableToolbarAction>
												</TableToolbarMenu>
												<Button
													tabIndex={getBatchActionProps().shouldShowBatchActions ? -1 : 0}
													onClick={() => {
														handleRun(selectedRows);
													}}
													kind="primary"
													disabled={invalidIteration || invalidDelay || testRunning}
													renderIcon={testRunning ? InlineLoading : Play}
												>
													Run
												</Button>
												{testRunning && (
													<Button
														tabIndex={getBatchActionProps().shouldShowBatchActions ? -1 : 0}
														onClick={() => {
															handleStop(selectedRows);
														}}
														kind="danger"
														style={{ marginLeft: "1rem" }}
														renderIcon={Stop}
													>
														Stop
													</Button>
												)}
											</TableToolbarContent>
										</TableToolbar>
										<Table size="md">
											<TableHead>
												<TableRow>
													<TableSelectAll {...getSelectionProps()} />
													{headers.map((header) => (
														<TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
													))}
												</TableRow>
											</TableHead>
											<TableBody>
												{rows.map((row) => (
													<TableRow
														{...getRowProps({ row })}
														className="datatable-fixed-row"
													>
														<TableSelectRow {...getSelectionProps({ row })} />
														{row.cells.map((cell) => (
															<TableCell key={cell.id}>
																{/* {cell.value} */}
																{cell.info.header === "enhancements_url" ? (
																	<a
																		href={cell.value}
																		target="_blank"
																		onClick={(e) => e.stopPropagation()}
																	>
																		{cell.value}
																	</a>
																) : (
																	cell.value
																)}
															</TableCell>
														))}
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							/>
						</div>
					</Column>
					<Column>
						<div
							style={{ border: "1px solid #ccc", height: "80vh", padding: "0% 2% 2% 2%", overflow: "auto" }}
							className="scrollable-div"
						>
							<ContainedList
								label={
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between"
										}}
									>
										<span>Test runner output</span>
										<Button
											onClick={() => {
												clearResults();
											}}
											kind="ghost"
											disabled={invalidIteration}
										>
											Clear results
										</Button>
									</div>
								}
								kind="on-page"
							>
								{apiResponse.map((data, index) => (
									<ContainedListItem
										key={index}
										onClick={handleClick}
									>
										<div
											className="first-div"
											style={{ display: "flex", width: "100%" }}
										>
											<div style={{ width: "60%" }}>
												{data.method}: {data.apiName}{" "}
											</div>
											<span style={{ color: getColorScheme(data.statusCode), width: "40%", textAlign: "right" }}>
												{data.status} {data.statusCode}
												<span style={{ marginLeft: "10%", color: "green" }}>{data.time}</span>
											</span>
										</div>
									</ContainedListItem>
								))}
								<div style={{ position: "relative", width: "100%" }}>
									{averageTime !== null && <p style={divTotalApi}>API selected: {selectedApiCount}</p>}
									{averageTime !== null && <p style={divAverageTime}>Average time: {averageTime.toFixed(2)} ms</p>}
								</div>
							</ContainedList>
						</div>
					</Column>
				</Row>
			</FlexGrid>
		</div>
	);
}

export default RunTest;
