/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../contexts/GlobalContext";
import { Checkbox, Modal } from "@carbon/react";

function ExportCollectionModal(props) {
	const { globalStore, getById } = useContext(GlobalStore);
	const [includeHeaders, setIncludeHeaders] = useState(true);

	useEffect(() => {}, [globalStore]);

	const exportCollection = () => {
		// Get collection to be exported
		const collection = getById(props.exportCollectionProps.id);

		function getHeaders(headersObj) {
			let headers = [];
			if (headersObj) {
				for (var header in headersObj) {
					headers.push({ key: header, value: includeHeaders ? headersObj[header] : "" });
				}
			}
			return headers;
		}

		function getQueryParams(queryParamsObj) {
			let params = [];
			if (queryParamsObj) {
				for (var param in queryParamsObj) {
					params.push({ key: param, value: queryParamsObj[param] });
				}
			}
			return params;
		}

		function exportCollection(item) {
			if (!item || !Array.isArray(item)) {
				return [];
			}

			return item.map((it) => {
				if (it.items) {
					return {
						name: it.name,
						item: exportCollection(it.items)
					};
				} else {
					return {
						name: it.name,
						request: {
							method: it.method,
							header: getHeaders(it.headers),
							reqBodyType: it.reqBodyType,
							body: it.reqBody
								? {
										raw: it.reqBody
									}
								: {},
							url: {
								raw: it.endpoint,
								query: getQueryParams(it.queryParams)
							}
						},
						response: []
					};
				}
			});
		}

		try {
			let content = {
				info: {
					name: collection.name,
					encodedUser: globalStore.encodedUser,
					exportTimestamp: new Date().toString()
				},
				item: exportCollection(collection.items)
			};

			let exportFilename = collection.name + "-echo.json";
			downloadExport(content, exportFilename);

			props.closeExportCollectionModal();
		} catch (error) {
			console.log("An error occurred during export collection ", collection.name, " - ", error);
		}
	};

	const downloadExport = (content, exportFilename) => {
		var blob = new Blob([JSON.stringify(content)], { type: "octect/stream" });
		if (window.navigator.msSaveBlob) {
			// IE 10+
			window.navigator.msSaveBlob(blob, exportFilename);
		} else {
			var url = window.URL.createObjectURL(blob);
			var a = document.createElement("a");
			document.body.appendChild(a);
			a.href = url;
			a.download = exportFilename;

			// setTimeout is required for older versions of Safari
			setTimeout(() => {
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}, 1);
		}
	};

	return (
		<Modal
			size="sm"
			open={true}
			modalHeading="Export collection"
			primaryButtonText="Export"
			secondaryButtonText="Cancel"
			onRequestClose={props.closeExportCollectionModal}
			onRequestSubmit={exportCollection}
		>
			<p>{`Collection ${props.exportCollectionProps.name} will be exported.`}</p>
			<br />
			<Checkbox
				id="include-headers-checkbox"
				labelText={"Include header values"}
				defaultChecked="true"
				checked={includeHeaders}
				onChange={(_, { checked }) => setIncludeHeaders(checked)}
			/>
		</Modal>
	);
}

export default ExportCollectionModal;
