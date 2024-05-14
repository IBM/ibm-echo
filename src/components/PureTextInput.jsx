import React, { useState, useEffect } from "react";
import TextInput from "react-autocomplete-input";
import { debounce } from "../hooks/debounce";
import PropTypes from "prop-types";

function PureTextInput({ defaultValue, id, domId, type, changeHandler, options, className, placeholder }) {
	const [value, setValue] = useState(defaultValue || null);
	const debounceHook = debounce(value, 800);

	/**
	 * Once user stops typing we wait for 500 ms
	 * and if user is no more typing even after 500 ms
	 * then we update the global state with this data
	 */
	useEffect(() => {
		changeHandler(id, type, value);
	}, [debounceHook]);

	/**
	 *
	 * @param {EventTarget.value} value
	 */
	const handleOnChange = (value) => {
		setValue(value);
	};

	return (
		<TextInput
			className={className}
			labelText="Enter overrides here (key: JSON path)"
			id={domId}
			size="lg"
			onChange={handleOnChange}
			value={value}
			spacer="}}"
			placeholder={
				placeholder ||
				"If last node response was {'address': {'city': 'NY'}}, then the JSON path of 'city' is \nkey: $.address.city"
			}
			trigger={["{{"]}
			options={options}
		/>
	);
}

PureTextInput.propTypes = {
	defaultValue: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	domId: PropTypes.string,
	type: PropTypes.string.isRequired,
	changeHandler: PropTypes.func.isRequired,
	options: PropTypes.array,
	className: PropTypes.string,
	placeholder: PropTypes.string
};

/**
 * TextInputs are usually controlled form elements,
 * so constant updates on a large component that also
 * manages TextInput states within it can lead to performance issues.
 * This is because setState is triggered with every letter entered or removed,
 * causing unnecessary updates to other data and all child components.
 * To address this, we can make TextInput a pure component so that
 * setState only affects this component without re-rendering any other components.
 */
export default React.memo(PureTextInput);
