/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

export const CommonUtil = {
	runReplacements: (text, type, globalStore) => {
		let match = null,
			flag = true;
		if (type === "endpoint" || type === "requestBodyString") {
			while ((match = /{{(.*?)}}/g.exec(text)) !== null && flag) {
				let matched = globalStore.globalVars.find((variable) => variable.key === match[1]);
				if (matched) {
					flag = true;
					text = text.replace(`{{${match[1]}}}`, matched.value);
				} else {
					flag = false;
					text = match[1];
				}
			}

			return { text, flag };
		}

		const replacePlaceholder = (input) => {
			if (typeof input === "string") {
				let match;
				while ((match = /{{(.*?)}}/g.exec(input)) !== null && flag) {
					let matched = globalStore.globalVars.find((variable) => variable.key === match[1]);
					if (matched) {
						input = input.replace(`{{${match[1]}}}`, matched.value);
						input = input.replace(/(?<!\\)"/g, "");
					} else {
						input = match[1];
						flag = false;
					}
				}
				return input;
			} else if (Array.isArray(input)) {
				return input.map(replacePlaceholder);
			} else if (typeof input === "object" && input !== null) {
				return Object.fromEntries(
					Object.entries(input).map(([key, value]) => [replacePlaceholder(key), replacePlaceholder(value)])
				);
			} else {
				return input;
			}
		};

		if (type === "requestBodyObj") {
			return { text: replacePlaceholder(text), flag };
		}

		if (type === "headers") {
			let headers = Object.entries(text);
			for (let idx = 0; idx < headers.length; idx++) {
				if ((match = /{{(.*?)}}/g.exec(headers[idx][0])) !== null) {
					let matched = globalStore.globalVars.find((variable) => variable.key === match[1]);
					if (matched) {
						flag = true;
						headers[idx][0] = headers[idx][0].replace(`${match[0]}`, matched.value);
						if (type === "requestBodyObj") {
							headers[idx][0] = headers[idx][0].replace(/(?<!\\)"/g, "");
						}
					} else {
						flag = false;
					}
				}

				if ((match = /{{(.*?)}}/g.exec(headers[idx][1])) !== null) {
					let matched = globalStore.globalVars.find((variable) => variable.key === match[1]);
					if (matched) {
						flag = true;
						headers[idx][1] = headers[idx][1].replace(`${match[0]}`, matched.value);
						if (type === "requestBodyObj") {
							headers[idx][1] = headers[idx][1].replace(/(?<!\\)"/g, "");
						}
					} else {
						flag = false;
					}
				}

				if (!flag) {
					text = match[1];
					break;
				}
			}
			return { text: Object.fromEntries(headers), flag };
		}
	}
};
