const { default: axios } = require('axios');
var TurndownService = require('turndown')
let crypto = require('crypto')

var turndownService = new TurndownService().remove(['script', 'style', 'title'])
let reTokenEmail = /^([^@_]+)[@_]/

async function processApi(data) {
	let token = (data.from.match(reTokenEmail)?.[1] ?? '') + (data.to.match(reTokenEmail)?.[1] ?? '');
	// let token = Buffer.from(tokenb64, 'base64url').toString('hex');
	let secret = "SEC" + data.user + data.pass; // remove sec
	// let secret = Buffer.from(secretb64, 'base64url').toString('hex');
	let timestamp = Date.now();
	let md = turndownService.turndown(data.html);
	// console.log(data, md);
	let dingtalkData = {
		msgtype: 'markdown',
		markdown: {
			title: data.subject,
			text: md,
		}
	}
	const stringToSign = timestamp + "\n" + secret;
	const sign = crypto.createHmac('sha256', secret).update(stringToSign).digest().toString("base64");
	let url = `https://oapi.dingtalk.com/robot/send?access_token=${token}&timestamp=${timestamp}&sign=${sign}`;
	let error = false;
	try {
		let ret = await axios.request({
			url: url,
			method: "POST",
			data: dingtalkData,
		});
		if (ret.status == 200) {
			let errorcode = ret.data.errcode;
			if (errorcode != 0) {
				error = {
					message: ret.data.errmsg
				}
			}
		}
	} catch (e) {
		error = {
			message: e
		};
	}
	return error;
}

module.exports.process = processApi;