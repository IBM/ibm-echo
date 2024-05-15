import React from "react";
import CollectionsView from "./CollectionsView";
import SettingsView from "./SettingsView";
import RequestTabs from "./RequestTabs";
import GlobalContextProvider, { GlobalStore } from "../contexts/GlobalContext";
import Splitter from "./Splitter";
import { useResizable } from "react-resizable-layout";

function Tool() {
	const { isDragging, position, splitterProps } = useResizable({
		axis: "x",
		min: 220,
		initial: 250,
		max: 600
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

	return (
		<GlobalContextProvider>
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
		</GlobalContextProvider>
	);
}

export default Tool;
