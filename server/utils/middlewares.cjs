/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

const getDurationInMilliseconds = (start) => {
	const NS_PER_SEC = 1e9;
	const NS_TO_MS = 1e6;
	const diff = process.hrtime(start);

	return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

function memorySizeOf(obj) {
	var bytes = 0;

	function sizeOf(obj) {
		if (obj !== null && obj !== undefined) {
			switch (typeof obj) {
				case "number":
					bytes += 8;
					break;
				case "string":
					bytes += obj.length * 2;
					break;
				case "boolean":
					bytes += 4;
					break;
				case "object":
					var objClass = Object.prototype.toString.call(obj).slice(8, -1);
					if (objClass === "Object" || objClass === "Array") {
						for (var key in obj) {
							if (!obj.hasOwnProperty(key)) continue;
							sizeOf(obj[key]);
						}
					} else bytes += obj.toString().length * 2;
					break;
			}
		}
		return bytes;
	}

	function formatByteSize(bytes) {
		if (bytes < 1024) return bytes + " bytes";
		else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB";
		else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB";
		else return (bytes / 1073741824).toFixed(3) + " GiB";
	}

	return formatByteSize(sizeOf(obj));
}

function responseTime(req, res, next) {
	req.startTime = process.hrtime();
	var send = res.send;
	res.send = function (body) {
		/**
		 * It might be a little tricky here, because send supports a variety of arguments, and you have to make sure you support all of them!
		 * Do something with the body...
		 */
		body["executionTime"] = parseInt(getDurationInMilliseconds(req.startTime)) + " ms";
		body["responseSize"] = memorySizeOf(body["data"]);
		send.call(this, body);
	};
	next();
}

const paginationValidator = (req, res, next) => {
	const { ps, pn } = req.query;
	if (!ps || !pn)
		return res.status(400).send({
			status: 400,
			message: "pageSize (ps) or pageNum (pn) missing",
			data: []
		});
	if (isNaN(ps))
		return res.status(400).send({
			status: 400,
			message: "pageSize (ps) must be +ve Integer",
			data: []
		});
	if (isNaN(pn))
		return res.status(400).send({
			status: 400,
			message: "pageNum (pn) must be +ve Integer",
			data: []
		});
	if (parseInt(ps) <= 0)
		return res.status(400).send({
			status: 400,
			message: "pageSize (ps) : Integer, should be greater than Zero(0)",
			data: []
		});
	if (parseInt(pn) < 0)
		return res.status(400).send({
			status: 400,
			message: "pageNum (pn) : Integer, should be greater than equal to Zero(0)",
			data: []
		});

	// if validation was successful pass on to api call
	next();
};

module.exports = { responseTime, paginationValidator };
