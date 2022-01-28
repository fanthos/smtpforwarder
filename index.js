let smtp = require('smtp-server');
let parser = require('mailparser');

let port = process.env.SMTP_PORT || 31101;

const handlerMap = new Map();

function getHandler(handlerName) {
	let handlerName1 = handlerName.replace(/[^a-z0-9_-]/gi, '_');
	let handler = handlerMap.get(handlerName1);
	if (handler != null) {
		return handler;
	}
	try {
		handler = require("./handlers/" + handlerName1);
		handlerMap.set(handlerName1, handler);
		return handler;
	} catch (e) {
		return e;
		// console.info('Handler loading error: ', e);
	}
}

/**
 * 
 * @param {import('mailparser').ParsedMail} maildata 
 * @param {import('smtp-server').SMTPServerSession} session 
 */
async function processMessage(maildata, session) {
	let text = maildata.text;
	let html = maildata.html || maildata.textAsHtml || ('<p>' + maildata.text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>') + '</p>');
	let subject = maildata.subject;
	let from = (session.envelope.mailFrom || maildata.from.value[0]).address;
	let to = ((session.envelope.rcptTo && session.envelope.rcptTo[0]) || maildata.to.value[0]).address;
	let user = session.user.username;
	let pass = session.user.password;

	let api = to.match(/.+@([^@.]+)(?:\..+)?$/)[1];

	let handler = getHandler(api);
	if (handler == null || handler.process == null) {
		return handler;
	}
	return await (handler.process({
		text,
		html,
		subject,
		from,
		to,
		user,
		pass,
	}))
}

const server = new smtp.SMTPServer({
	secure: false,
	async onData(stream, session, callback) {
		// stream.on('end', callback);
		// console.log(session);
		// stream.pipe(process.stdout);
		let ret;
		try {
			let parsed = await parser.simpleParser(stream);
			ret = await processMessage(parsed, session);
		} catch (e) {
			ret = e || { message: 'Error when processing message' };
		}
		callback(ret);
	},
	onAuth(auth, session, callback) {
		callback(null, {
			user: auth
		})
	}
});

server.listen(port);
server.on('error', e => {
	console.log(e)
})
console.log('started');