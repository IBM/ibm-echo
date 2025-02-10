/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

var IS_ELECTRON_ENV = false;
try {
	var { app, BrowserWindow } = require("electron/main");
	var { webFrame } = require("electron");
	console.warn("Running app in Native desktop app mode...");
	IS_ELECTRON_ENV = true;
} catch (err) {
	console.warn("Running app in backend server mode...");
	if (err.message.includes("Cannot find module") && process.env.IS_ELECTRON_BUILD?.toString() === "true") {
		IS_ELECTRON_ENV = true;
	}

	if (err.message.includes("Cannot find module") && process.env.IS_ELECTRON_BUILD?.toString() !== "true") {
		IS_ELECTRON_ENV = false;
	}
}

const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const axios = require("axios");
const expressApp = express();
var https = require("https");
var cors = require("cors");
var history = require("connect-history-api-fallback");
var cookieParser = require("cookie-parser");
const { responseTime } = require("./utils/middlewares.cjs");
var session = require("express-session");

const PORT = IS_ELECTRON_ENV ? 7857 : process.env.SERVER_PORT || 3000;

expressApp.use(cookieParser());
expressApp.use(express.json());
expressApp.use(cors());
expressApp.use(responseTime);

expressApp.use(
	session({
		secret: "asdasdsadsa",
		resave: false,
		saveUninitialized: false,
		proxy: true,
		rolling: true
	})
);

expressApp.get("/healthCheck", (req, res) => {
	res.statusCode = 200;
	res.json({
		message: "Health check done",
		status: "OK"
	});
});

expressApp.get("/sanity", async (req, res) => {
	return res.send({ status: 200, message: "IBM | ECHO server up and running..." });
});

expressApp.post("/proxy", async (req, res) => {
	let requestBody = undefined;
	if (req.body.reqBody && Object.keys(req.body.reqBody).length > 0) {
		switch (req.body.reqBody) {
			case "json": {
				requestBody = req.body.reqBody;
				break;
			}
			case "urlencoded": {
				const lines = req.body.reqBody.split("\n");
				const data = new URLSearchParams();
				lines.forEach((line) => {
					const [key, value] = line.split(":");
					if (key && value) {
						data.append(key.trim(), value.trim());
					}
				});
				requestBody = data.toString();
				break;
			}
			case "xml": {
				// Ensure Content-Type is set to application/xml
				if (!req.body.headers) {
					req.body.headers = {};
				}
				if (!req.body.headers['Content-Type']) {
					req.body.headers['Content-Type'] = 'application/xml';
				}
				break;
			}
			default:
				// No specific action for other types
				break;
		}
	}

	let httpsAgent = null;
	if (req.body.certificate) {
		httpsAgent = new https.Agent({
			rejectUnauthorized: true,
			cert: req.body.certificate,
			key: req.body.key,
			passphrase: req.body.passphrase
		});
	}

	axios({
		method: req.body.method,
		url: req.body.url,
		headers: req.body.headers,
		data: requestBody,
		httpsAgent: httpsAgent
	})
		.then((response) => {
			res.send({
				data: {
					message: response.data,
					statusCode: response.status,
					status: response.statusText
				},
				responseHeaders: response.headers
			});
		})
		.catch((error) => {
			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				res.status(error.response.status).send({ data: error.response.data });
			} else if (error.request) {
				// The request was made but no response was received
				// `error.request` is an instance of XMLHttpRequest in the browser
				// and an instance of http.ClientRequest in node.js
				console.log("error.request - ", error.request);
				console.log("error message - ", error.message);
				res.status(500).send({
					message: "Failed: " + error.message
				});
			} else {
				// Something happened in setting up the request that triggered an Error
				console.log("Unexpected error - ", error.message);
				res.status(500).send({
					message: error.message
				});
			}
		});
});

// Dummy Test APIs
expressApp.get("/order", (req, res) => {
	try {
		const email = req.query["email"];
		const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

		if (emailRegex.test(email)) {
			return res.status(200).json({
				orn: "5c2bg1700199970955"
			});
		} else {
			return res.status(400).json({
				message: "Bad request - email not found"
			});
		}
	} catch (error) {
		res.status(500).send({ message: error.toString() });
	}
});

expressApp.get("/subscription", (req, res) => {
	try {
		const orn = req.query["orn"];

		if (orn === "5c2bg1700199970955") {
			setTimeout(() => {
				return res.status(200).json({
					subscriptionId: "50201",
					name: "IBM MaaS360 Essentials Suite",
					state: "ACTIVE",
					quantity: 33,
					type: "PURCHASED",
					category: "SAAS"
				});
			}, 1000);
		} else {
			return res.status(400).json({
				message: "Bad request - ORN not found"
			});
		}
	} catch (error) {
		res.status(500).send({ message: error.toString() });
	}
});

expressApp.get("/ssm/subscription", (req, res) => {
	try {
		const subId = req.query["subId"];

		if (subId === "50201") {
			setTimeout(() => {
				return res.status(200).json({
					Owner: "520123876",
					PartNumber: "D1P3GLL",
					SubscriptionState: "ACTIVE",
					CustomerId: "520115476"
				});
			}, 2000);
		} else {
			return res.status(400).json({
				message: "Bad request - Subscription not found"
			});
		}
	} catch (error) {
		res.status(500).send({ message: error.toString() });
	}
});

expressApp.get("/customer", (req, res) => {
	try {
		const custId = req.query["custId"];

		if (custId === "520115476") {
			setTimeout(() => {
				return res.status(200).json({
					StateCode: "US_TX",
					City: "Dallas",
					RRN: "MAILING",
					Country: "UNITED STATES",
					Id: "522243934"
				});
			}, 500);
		} else {
			return res.status(400).json({
				message: "Bad request - Customer not found"
			});
		}
	} catch (error) {
		res.status(500).send({ message: error.toString() });
	}
});

expressApp.post("/user", (req, res) => {
	try {
		const { firstName, lastName, city, state, country } = req.body;
		res.send({
			data: {
				message: `userId: ${firstName}.${lastName}`,
				statusCode: 201,
				status: "ACCEPTED"
			},
			responseHeaders: null
		});
	} catch (error) {
		res.status(500).send({ message: error.toString() });
	}
});

expressApp.use(history());
expressApp.use(express.static(path.join(__dirname, IS_ELECTRON_ENV ? "dist" : "../dist")));

if (!IS_ELECTRON_ENV) {
	expressApp.listen(PORT, () => console.info("HTTP Server started at PORT = " + PORT));
}

if (IS_ELECTRON_ENV) {
	var privateKey = fs.readFileSync(path.join(__dirname, "server.key"), "utf8");
	var certificate = fs.readFileSync(path.join(__dirname, "server.crt"), "utf8");

	var credentials = { key: privateKey, cert: certificate };
	/**
	 * Command to generate certs -- openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./server.key -out server.crt
	 */
	https.createServer(credentials, expressApp).listen(PORT, function (req, res) {
		console.log(`HTTPS Server started at PORT = ${PORT}`);
		const createWindow = () => {
			const win = new BrowserWindow({
				width: 1200,
				height: 700,
				webPreferences: {
					nodeIntegration: true,
					contextIsolation: true
				}
			});

			win.loadURL(`https://localhost:${PORT}/`);
			webFrame?.setZoomLevel(0.5);
		};

		app.whenReady().then(() => {
			createWindow();

			app.on("activate", () => {
				if (BrowserWindow.getAllWindows().length === 0) {
					createWindow();
				}
			});
		});

		app.on("window-all-closed", () => {
			if (process.platform !== "darwin") {
				app.quit();
			}
		});

		app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
			// Prevent having error
			event.preventDefault();
			// and continue
			callback(true);
		});
	});
}
