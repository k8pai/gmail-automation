const { makeBody, decodeBase64, filterHeaders } = require('../helpers');
const { decode } = require('he');

/**
 * Sends a new Mail.
 *
 * @param {gmail_v1.Gmail} gmail A Gmail API client.
 * @param {gmail_v1.Schema$Message} message Messages array that contains a list of messages for which we have to provide replies.
 */
const sendMail = async (gmail, message) => {
	// Get the email's subject and body
	const { id, snippet: subject, to: sendTo, payload } = message;

	// Filters Header Contents and returns an object type which includes `Subject`, `From` etc...
	let filteredHeaders = filterHeaders(payload.headers);

	// Compose a reply email
	const replyOptions = {
		from: 'me',
		to: sendTo,
		subject: `RE: ${filteredHeaders.Subject ?? 'Vaccation Alert'}`,
		text: `Hey,\n\nI'm on my vaccations.\n\nI'll ping you when i'm back...\n\n`,
	};

	const requestBody = {
		raw: makeBody(sendTo, 'me', replyOptions.subject, replyOptions.text),
	};

	// Send the reply email
	await gmail.users.messages.send({
		userId: 'me',
		requestBody,
	});
};

module.exports = {
	sendMail,
};
