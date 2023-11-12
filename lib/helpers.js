const base64 = require('base64-js');

/**
 * Gets the Mail ID of the user who sent a message.
 *
 * @param {gmail_v1.Schema$MessagePartHeader[]} headers Payload Headers of the mail that comes with each message.
 * @return {string} Returns the value of the message sender.
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
 * @return {string} Returns the encoded raw data back.
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

/**
 * Decode base64 encoded string
 *
 * @param {string} encodedBody Base64 encoded string to be decoded.
 * @return {string} Returns the Base64 decoded Response.
 */
function decodeBase64(encodedBody) {
	const decodedBody = base64.toByteArray(
		encodedBody.replace(/\-/g, '+').replace(/_/g, '/'),
	);
	return Buffer.from(decodedBody).toString('utf8');
}

/**
 * Removes Hyphens in the provided string.
 *
 * @param {string} string String to replace hyPhens from.
 * @return {string} Returns the string, without hyPhens.
 */
function replaceHyphens(string) {
	return string.replace(/-/g, '');
}

/**
 * Converts An array objects to an object with all the values obects spead into the single object
 *
 * @param {{name: string, value: string}[]} headers An Array of objects with fields `name` and `value`.
 * @return {object} Returns the Objects with all the name and values spread from the array.
 */
const filterHeaders = (headers) => {
	let res = {};
	headers.map(({ name, value }, _) => {
		let key = replaceHyphens(name);
		res = {
			...res,
			[key]: value,
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
