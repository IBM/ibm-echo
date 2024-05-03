/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";

const Splitter = ({ id = "drag-bar", dir, isDragging, ...props }) => {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div
			className="horizontalSplitter"
			id={id}
			data-testid={id}
			tabIndex={0}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
			{...props}
		></div>
	);
};

export default Splitter;
