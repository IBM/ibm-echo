/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
	packagerConfig: {
		asar: true,
		overwrite: true,
		executableName: "IBM Echo",
		name: "IBM Echo"
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {}
		},
		{
			name: "@electron-forge/maker-zip"
		},
		{
			name: "@electron-forge/maker-deb",
			config: {}
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {}
		},
		{
			name: "@electron-forge/maker-dmg",
			config: {
				format: "ULFO"
			}
		}
	],
	plugins: [
		{
			name: "@electron-forge/plugin-auto-unpack-natives",
			config: {}
		}
	]
};
