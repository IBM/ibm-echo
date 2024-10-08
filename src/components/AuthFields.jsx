import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import PureTextInput from "./PureTextInput";

export const AuthFields = ({ authType, onHeaderChange }) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [token, setToken] = useState("");

	const updateAuthorizationHeader = () => {
		let authorizationHeader = "";
		if (username && password) {
			// Encode the username and password in base64 to create an Authorization header
			const base64Credentials = btoa(`${username}:${password}`);
			authorizationHeader = `Basic ${base64Credentials}`;
		} else if (token) {
			authorizationHeader = `Bearer ${token}`;
		}
		onHeaderChange(authorizationHeader ? { Authorization: authorizationHeader } : {});
	};

	useEffect(() => {
		updateAuthorizationHeader();
	}, [username, password, token]);

	return (
		<>
			{authType.id === "basic" && (
				<div className="node-parameters-inputText">
					<div className="cds--label">Username</div>
					<PureTextInput
						className="cds--text-input node-parameters-modal"
						domId="username"
						changeHandler={(id, type, value) => setUsername(value)}
						type="text"
						id="username"
						placeholder="Enter Username"
						defaultValue={username}
					/>
					<br />
					<br />
					<div className="cds--label">Password</div>
					<PureTextInput
						className="cds--text-input node-parameters-modal"
						domId="password"
						changeHandler={(id, type, value) => setPassword(value)}
						type="text"
						id="password"
						placeholder="Enter Password"
						defaultValue={password}
					/>
				</div>
			)}

			{authType.id === "bearerToken" && (
				<div className="node-parameters-inputText">
					<div className="cds--label">Token</div>
					<PureTextInput
						className="cds--text-input node-parameters-modal"
						domId="token"
						changeHandler={(id, type, value) => setToken(value)}
						type="text"
						id="token"
						placeholder="Enter Bearer Token"
						defaultValue={token}
					/>
				</div>
			)}
		</>
	);
};

AuthFields.propTypes = {
	authType: PropTypes.object,
	onHeaderChange: PropTypes.func.isRequired
};
