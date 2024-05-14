/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useEffect, useRef, useState } from "react";
import GlobalContextProvider, { GlobalStore } from "../contexts/GlobalContext";
import { Button, TextInput } from "@carbon/react";
import { Add, ArrowRight, Subtract } from "@carbon/react/icons";

function EnvironmentVarView() {
	const { globalStore, addGlobalVariable, removeGlobalVariable } = useContext(GlobalStore);
	const [state, setState] = useState({ isKeyNameValid: 0, isKeyValueValid: 0 });
	const keyRef = useRef();
	const valueRef = useRef();
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
		console.log("EnvironmentVarView: globalStore changed - ", globalStore.globalVars);
	}, [globalStore.globalVars]);

	const addEnvVariable = () => {
		var isValid = true;
		if (state.isKeyNameValid != 1 || keyRef.current.value.trim().length === 0) {
			setState((prevState) => ({ ...prevState, isKeyNameValid: -1 }));
			isValid = false;
		}
		if (state.isKeyValueValid != 1 || valueRef.current.value.trim().length === 0) {
			setState((prevState) => ({ ...prevState, isKeyValueValid: -1 }));
			isValid = false;
		}

		if (!isValid) {
			return;
		}

		if (globalStore.globalVars.find((elem) => elem.key === keyRef.current.value.trim())) {
			window.alert("Variable with this name already exists! Please enter a different name.");
		} else {
			addGlobalVariable({ key: keyRef.current.value.trim(), value: valueRef.current.value.trim() });
			keyRef.current.value = "";
			valueRef.current.value = "";
		}
	};

	const onKeyChange = () => {
		let keyName = keyRef.current;
		keyName = keyName.value;

		if (!keyName) {
			setState((prevState) => ({ ...prevState, isKeyNameValid: -1 }));
		} else if (keyName.trim().length === 0) {
			setState((prevState) => ({ ...prevState, isKeyNameValid: 0 }));
		} else {
			setState((prevState) => ({ ...prevState, isKeyNameValid: 1 }));
		}
	};

	const onValueChange = () => {
		let keyValue = valueRef.current;
		keyValue = keyValue.value;

		if (!keyValue) {
			setState((prevState) => ({ ...prevState, isKeyValueValid: -1 }));
		} else if (keyValue.trim().length === 0) {
			setState((prevState) => ({ ...prevState, isKeyValueValid: 0 }));
		} else {
			setState((prevState) => ({ ...prevState, isKeyValueValid: 1 }));
		}
	};

	return (
		<div>
			<div style={{ fontWeight: "bold", flex: "2", marginBottom: "20px" }}>
				Add your environment variables below as key-value pairs. You can access them using the syntax {`{{key}}`} <br />{" "}
				in request endpoint, headers and query parameters.
			</div>
			<div className="envVarLineItem">
				<TextInput
					data-modal-primary-focus
					id="env-var-key"
					labelText="Variable name"
					placeholder="e.g. host-url"
					autoComplete="off"
					invalid={state.isKeyNameValid == -1}
					invalidText={"Enter a valid key"}
					onChange={onKeyChange}
					ref={keyRef}
				/>
				<TextInput
					data-modal-primary-focus
					id="env-var-value"
					labelText="Variable value"
					placeholder="e.g. ibm"
					autoComplete="off"
					invalid={state.isKeyValueValid == -1}
					invalidText={"Enter a valid value"}
					onChange={onValueChange}
					ref={valueRef}
				/>
				<div>
					<Button
						className="envVarsBtn"
						renderIcon={Add}
						onClick={addEnvVariable}
						size="md"
					>
						Add
					</Button>
				</div>
			</div>
			{globalStore.globalVars.length === 0 && <div style={{ marginTop: "20px" }}>No variables added yet</div>}
			{globalStore.globalVars.length > 0 &&
				globalStore.globalVars.map((variable) => (
					<div className="envVariable">
						<div className="envVariable-key">{variable.key}</div>
						<ArrowRight />
						<div className="envVariable-value">{variable.value}</div>
						<Button
							renderIcon={Subtract}
							kind="secondary"
							hasIconOnly
							iconDescription="Remove variable"
							onClick={() => removeGlobalVariable(variable)}
							size="md"
							tooltipPosition="left"
						></Button>
					</div>
				))}
		</div>
	);
}

export default EnvironmentVarView;
