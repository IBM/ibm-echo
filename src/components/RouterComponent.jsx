/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Routes, Route } from "react-router-dom";
import Overview from "./Overview";
import Tool from "./Tool";
import Global404 from "./Global404";

function RouterComponent() {
	return (
		<div className="mainContent">
			<Routes>
				<Route
					exact
					path="/"
					element={<Tool />}
				/>
				<Route
					exact
					path="/tool"
					element={<Tool />}
				/>
				<Route
					exact
					path="/overview"
					element={<Overview />}
				/>
				<Route
					exact
					path="*"
					element={<Global404 />}
				/>
			</Routes>
		</div>
	);
}

export default RouterComponent;
