/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import { Settings, TrashCan } from "@carbon/react/icons";
import { Button, Stack, TabList, TabPanel, TabPanels } from "@carbon/react";
import React, { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../contexts/GlobalContext";
import { Modal, Tabs, Tab, TextInput, FileUploader, FormLabel } from "@carbon/react";
import { customAlphabet } from "nanoid";
import EnvironmentVarView from "./EnvironmentVarView";

function SettingsView() {
	const { globalStore, setGlobalStore, deleteItemById } = useContext(GlobalStore);

	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [showAddCertificateModal, setShowAddCertificateModal] = useState(false);
	const [certificateHost, setCertificateHost] = useState("");
	const [isCertificateHostValid, setIsCertificateHostValid] = useState(0);
	const [isCertificateHostValidText, setIsCertificateHostValidText] = useState("");
	const [certificatePort, setCertificatePort] = useState();
	const [isCertificatePortValid, setIsCertificatePortValid] = useState(0);
	const [isCertificatePortValidText, setIsCertificatePortValidText] = useState("");
	const [crtFile, setCrtFile] = useState(null);
	const [keyFile, setKeyFile] = useState(null);
	const [crtFileName, setCrtFileName] = useState("");
	const [keyFileName, setKeyFileName] = useState("");
	const [certificatePassphrase, setCertificatePassphrase] = useState("");

	const nanoid = customAlphabet("1234567890abcdef", 10);

	const onClickSettings = () => {
		setShowSettingsModal(true);
	};

	const closeSettingsModal = () => {
		setShowSettingsModal(false);
	};

	const closeAddCertificateModal = () => {
		setShowAddCertificateModal(false);
		clearAddCertificateModal();
		setShowSettingsModal(true);
	};

	const onClickAddCertificate = () => {
		setShowAddCertificateModal(true);
		setShowSettingsModal(false);
	};

	const addCertificate = async () => {
		if (!certificateHost) {
			setIsCertificateHostValid(-1);
			setIsCertificateHostValidText("Please enter a valid host");
			return;
		}
		storeCertificates();
		setShowAddCertificateModal(false);
		clearAddCertificateModal();
		setShowSettingsModal(true);
	};

	const clearAddCertificateModal = () => {
		setCertificateHost("");
		setCertificatePort("");
		setCertificatePassphrase("");
		setIsCertificateHostValid(0);
		setIsCertificateHostValidText("");
		setIsCertificatePortValid(0);
		setIsCertificatePortValidText("");
	};

	const onCertificateHostChange = (event) => {
		let host = event.target.value;
		setCertificateHost(host);

		if (host) {
			setIsCertificateHostValid(1);
			setIsCertificateHostValidText("");
		} else {
			setIsCertificateHostValid(-1);
			setIsCertificateHostValidText("Please enter a valid host. E.g.: https://ibm.com");
		}
	};

	const onCertificatePortChange = (event) => {
		let port = event.target.value;
		setCertificatePort(port);

		if (port && !isNaN(port)) {
			setIsCertificatePortValid(1);
			setIsCertificatePortValidText("");
		} else {
			setIsCertificatePortValid(-1);
			setIsCertificatePortValidText("Please enter a valid port number");
		}
	};

	const handleCrtFileChange = (event) => {
		let file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const content = event.target.result;
				setCrtFile(content);
			};
			reader.readAsText(file);
			setCrtFileName(event.target.files[0].name);
		}
	};

	const handleKeyFileChange = (event) => {
		let file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const content = event.target.result;
				setKeyFile(content);
			};
			reader.readAsText(file);
			setKeyFileName(event.target.files[0].name);
		}
	};

	const storeCertificates = () => {
		let storeCopy = JSON.parse(JSON.stringify(globalStore));
		let certificate = {
			id: nanoid(),
			host: certificateHost,
			port: certificatePort,
			crt: crtFile,
			key: keyFile,
			passphrase: certificatePassphrase,
			crtFileName: crtFileName,
			keyFileName: keyFileName
		};
		let certificates = [...storeCopy.certificates, certificate];
		storeCopy.certificates = certificates;
		setGlobalStore(storeCopy);
	};

	const onPassphraseChange = (event) => {
		let passphrase = event.target.value;
		setCertificatePassphrase(passphrase);
	};

	return (
		<div className="tool-settings">
			{showSettingsModal && (
				<Modal
					passiveModal
					size="sm"
					open={showSettingsModal}
					modalHeading="Settings"
					onRequestClose={closeSettingsModal}
				>
					<Tabs>
						<TabList>
							<Tab>Certificates</Tab>
							<Tab>Environment variables</Tab>
						</TabList>
						<TabPanels>
							<TabPanel>
								<div style={{ display: "flex", alignItems: "center" }}>
									<div style={{ fontWeight: "bold", flex: "2" }}>Manage your client SSL certificates</div>
									<div style={{ flex: "1", textAlign: "right" }}>
										<Button
											style={{ float: "right" }}
											onClick={onClickAddCertificate}
											size="md"
										>
											Add New
										</Button>
									</div>
								</div>
								<Stack
									orientation="vertical"
									gap={3}
								>
									{globalStore.certificates.map((item) => (
										<div>
											<div style={{ display: "flex", alignItems: "center" }}>
												<div style={{ flex: "2" }}>
													<FormLabel className="certificateLabel">Host</FormLabel>{" "}
													{item.port ? item.host + " : " + item.port : item.host} <br />
													<FormLabel className="certificateLabel">CRT</FormLabel> {item.crtFileName} <br />
													<FormLabel className="certificateLabel">Key</FormLabel> {item.keyFileName} <br />
												</div>
												<div style={{ flex: "1", textAlign: "right" }}>
													<TrashCan onClick={() => deleteItemById(item.id)} />
												</div>
											</div>
											<hr color="#D3D3D3" />
										</div>
									))}
								</Stack>
							</TabPanel>
							<TabPanel>
								<EnvironmentVarView />
							</TabPanel>
						</TabPanels>
					</Tabs>
				</Modal>
			)}
			{showAddCertificateModal && (
				<Modal
					size="md"
					open={showAddCertificateModal}
					modalHeading="Add Certificate"
					primaryButtonText="Add"
					secondaryButtonText="Cancel"
					onRequestClose={closeAddCertificateModal}
					onRequestSubmit={addCertificate}
				>
					<div style={{ display: "flex", alignItems: "center" }}>
						<div style={{ float: "left", flex: 2, marginRight: "20px" }}>
							<TextInput
								data-modal-primary-focus
								id="certificateHost"
								labelText="Host"
								placeholder="https://ibm.com"
								value={certificateHost}
								autoComplete="off"
								invalid={isCertificateHostValid === -1}
								invalidText={isCertificateHostValidText}
								onChange={onCertificateHostChange}
							/>
						</div>
						<div style={{ float: "left", flex: 1 }}>
							<TextInput
								id="certificatePort"
								labelText="Port"
								placeholder="443"
								value={certificatePort}
								autoComplete="off"
								invalid={isCertificatePortValid === -1}
								invalidText={isCertificatePortValidText}
								onChange={onCertificatePortChange}
							/>
						</div>
					</div>
					<br />
					<FileUploader
						id="crtFile"
						labelDescription="CRT file"
						buttonLabel="Choose file"
						buttonKind="primary"
						size="md"
						multiple={false}
						accept={[]}
						filenameStatus={crtFile ? "edit" : "empty"}
						onChange={handleCrtFileChange}
					/>
					<br />
					<FileUploader
						id="keyFile"
						labelDescription="Key file"
						buttonLabel="Choose file"
						buttonKind="primary"
						size="md"
						multiple={false}
						accept={[]}
						filenameStatus={keyFile ? "edit" : "empty"}
						onChange={handleKeyFileChange}
					/>
					<br />
					<TextInput
						id="passphrase"
						labelText="Passphrase"
						value={certificatePassphrase}
						autoComplete="off"
						onChange={onPassphraseChange}
					/>
				</Modal>
			)}
			<Button
				kind="secondary"
				className="tool-settingsBtn"
				renderIcon={Settings}
				onClick={onClickSettings}
			>
				Settings
			</Button>
		</div>
	);
}

export default SettingsView;
