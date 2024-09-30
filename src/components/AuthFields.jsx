import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import PureTextInput from "./PureTextInput";

export const AuthFields = ({ authType, onHeaderChange }) => {
	const [token, setToken] = useState("");

	const updateAuthorizationHeader = () => {
		let authorizationHeader = "";
		if (token) {
			authorizationHeader = `Bearer ${token}`;
		}
		onHeaderChange(authorizationHeader ? { Authorization: authorizationHeader } : {});
	};

	useEffect(() => {
		updateAuthorizationHeader();
	}, [token]);

	return (
		<>
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
