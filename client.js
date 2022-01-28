process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let smtpClient = require('nodemailer/lib/smtp-connection');
let composer = require('nodemailer/lib/mail-composer');

let conn = new smtpClient({
	host: '127.0.0.1',
	port: 31101,
	opportunisticTLS: true,
	// secure: true,
	// ignoreTLS: true,
})

setTimeout(() => {
	conn.connect(o => {
		conn.login({
				credentials: {
					user: 'test1@from.com',
					pass: 'test1'
				}
			},
			o1 => {
				conn.send({
					from: 'test1@from.com',
					to: 'test2@to.com',
				},
				"testSmtp",
				o2 => {
					console.log(o, o1, o2)
					conn.close()
				});
			}
		)
	})
}, 1000);