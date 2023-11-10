const base64 = require('base64-js');

/**
 * Gets the Mail ID of the user who sent a message.
 *
 * @param {gmail_v1.Schema$MessagePartHeader[]} headers Payload Headers of the mail that comes with each message.
 */

const getFromAddress = (headers) => {
	let res = headers.find(({ name, value }, _) => name === 'From');

	// console.log('send response to: ', res);
	return res.value;
};

/**
 * Converts the contents of the mail body to base64 Encoded raw data.
 *
 * @param {string} to Mail ID of the user to whom the message is to be sent.
 * @param {string} from Mail ID of the user who sends the mail, default value for authorized user is `me`.
 * @param {string} subject Subject of the mail.
 * @param {string} message Message contents in the mail.
 */
const makeBody = (to, from, subject, message) => {
	const str = `Content-Type: text/plain; charset="UTF-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
to: ${to}
from: ${from}
subject: ${subject}


${message}`;

	const encodedBody = base64.fromByteArray(Buffer.from(str));
	return encodedBody.replace(/\+/g, '-').replace(/\//g, '_');
};

function decodeBase64(encodedBody) {
	const decodedBody = base64.toByteArray(
		encodedBody.replace(/\-/g, '+').replace(/_/g, '/'),
	);
	return Buffer.from(decodedBody).toString('utf8');
}

const filterHeaders = (headers) => {
	let res = {};
	headers.map(({ name, value }, _) => {
		res = {
			...res,
			[name]: value,
		};
	});

	return res;
};

module.exports = {
	makeBody,
	getFromAddress,
	decodeBase64,
	filterHeaders,
};
