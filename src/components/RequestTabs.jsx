/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import { WatsonHealth3DCurveManual, Meter } from "@carbon/react/icons";
import { OverflowMenu, OverflowMenuItem, Tab, TabList, TabPanel, TabPanels, Tabs, Tag } from "@carbon/react";
import React, { useContext, useEffect, useState } from "react";
import RequestContent from "./RequestContent";
import RunTest from "./RunTest";
import { GlobalStore } from "../contexts/GlobalContext";
import { customAlphabet } from "nanoid";
import ApiChain from "./ApiChain";
const nanoid = customAlphabet("1234567890abcdef", 10);

function RequestTabs(props) {
	const { globalStore, setGlobalStore, activateItem, closeAllTabs } = useContext(GlobalStore);
	const [state, setState] = useState({
		tabs: [],
		collections: [],
		selectedIndex: 0
	});

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
		let apis = [];
		let collections = [];
		let selectedIndex = 0;
		let storeCopy = JSON.parse(JSON.stringify(globalStore));

		let breadcrumb = [];
		let makeTabs = (data) => {
			for (let item of data) {
				if (item.type === "request" || item.type === "runTest" || item.type === "chain" || item.type === "apiDoc") {
					if (item.isTabOpen) {
						item.breadcrumb = breadcrumb;
						breadcrumb = [];
						apis = [...apis, item];
						continue;
					}
				}

				if (item.items) {
					breadcrumb.push({ id: item.id, name: item.name });
					makeTabs(item.items);
				}
			}
		};

		makeTabs(storeCopy.apis);
		apis.forEach((api, idx) => {
			if (api.isActive) {
				selectedIndex = idx;
			}
		});

		setState((prevState) => ({ ...prevState, tabs: apis, selectedIndex, collections }));
	}, [globalStore.apis]);

	const getColorScheme = (type, method) => {
		if (type === "chain") return "high-contrast";
		if (type === "apiDoc") return "purple";
		if (method === "GET") return "green";
		if (method === "DELETE") return "red";
		if (method === "PUT") return "orange";
		if (method === "POST") return "teal";
		return "grey";
	};

	const handleTabChange = (obj) => {
		let tab = state.tabs[obj.selectedIndex];
		activateItem(tab.id);
	};

	const handleCloseTabRequest = (idx) => {
		let tab = state.tabs[idx];
		activateItem(tab.id, false);
	};

	const handleCloseAllTabs = () => {
		let ids = state.tabs.map((tab) => tab.id);
		closeAllTabs(ids);
	};

	const openApiDoc = () => {
		let tab = state.tabs[0];

		let doc = {
			id: nanoid(),
			apiId: tab.id,
			name: tab.name,
			description: "", //tab.description,
			type: "apiDoc",
			method: tab.method,
			endpoint: tab.endpoint,
			queryParams: tab.queryParams,
			headers: tab.headers,
			reqBodyType: tab.reqBodyType,
			reqBody: tab.reqBody,
			response: tab.response,
			curlCmd: ``,
			isActive: true,
			isTabOpen: true
		};

		let tabs = [...JSON.parse(JSON.stringify(globalStore.apis))];
		tabs = [...tabs, doc];
		setGlobalStore({ apis: tabs });
		return doc;
	};

	const handleNewRequest = () => {
		let tabs = [...JSON.parse(JSON.stringify(globalStore.apis))];
		let isUntitledPresent = false;

		tabs.forEach((tab) => {
			if (tab.name === "Untitled *" && tab.type === "request") {
				isUntitledPresent = true;
				tab.isActive = true;
			}
			if (tab.name !== "Untitled *" && tab.type === "request") {
				tab.isActive = false;
			}
		});

		if (!isUntitledPresent) {
			tabs = [
				...tabs,
				{
					id: nanoid(),
					type: "request",
					method: "GET",
					endpoint: "",
					name: "Untitled request *",
					description: "",
					headers: {},
					reqBody: "",
					reqBodyType: "none",
					queryParams: {},
					response: {},
					isTabOpen: true,
					isActive: true
				}
			];
		}

		setGlobalStore({ apis: tabs });
	};

	const getIcon = (type) => {
		if (type === "chain") {
			return WatsonHealth3DCurveManual;
		} else if (type === "runTest") {
			return Meter;
		} else if (type === "apiDoc") {
			return Document;
		}
		return null;
	};

	return (
		<Tabs
			selectedIndex={state.selectedIndex}
			defaultSelectedIndex={state.selectedIndex}
			onChange={handleTabChange}
			dismissable
			onTabCloseRequest={handleCloseTabRequest}
		>
			<div className="tool-tabsBar">
				{state.tabs.length > 0 && (
					<TabList
						className="tool-tabsList"
						aria-label="List of tabs"
						contained
						activation="automatic"
					>
						{state.tabs.map((tab, idx) => (
							<Tab key={idx}>
								<Tag
									renderIcon={getIcon(tab.type)}
									type={getColorScheme(tab.type, tab.method)}
								>
									{tab.type !== "apiDoc" ? tab.method : ""}
								</Tag>{" "}
								{tab.name}
							</Tab>
						))}
					</TabList>
				)}
				<OverflowMenu
					aria-label="overflow-menu"
					size="lg"
					align="right"
					flipped
				>
					<OverflowMenuItem
						itemText={"Add new request +"}
						onClick={handleNewRequest}
					/>
					<OverflowMenuItem
						itemText={"Close all"}
						onClick={handleCloseAllTabs}
						hasDivider
					/>
				</OverflowMenu>
			</div>
			<TabPanels>
				{state.tabs.map((tab) => (
					<TabPanel>
						{tab.type === "runTest" && <RunTest requestData={tab} />}
						{tab.type === "chain" && <ApiChain requestData={tab} />}
						{tab.type === "request" && <RequestContent requestData={tab} />}
					</TabPanel>
				))}
			</TabPanels>
		</Tabs>
	);
}

export default RequestTabs;
