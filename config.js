/**
 * Returns all the unread thread after the specificied Vaccation period;
 *
 * @param {gmail_v1.Gmail} labelName Messages are appended to this label.
 * @param {Date['toLocaleDateString']} vaccationStarts Date which you want to check for messages that are unread and from `vaccationStarts`.
 */
const config = {
	labelName: 'VACCATION', // Name of the label to be Appended to messages.
	vaccationStarts: '11/10/2023', // format - 'mm/dd/yyyy'.
	interval: 8000, // Interval for checking incoming messages.
	scopes: [
		'https://mail.google.com/',
		'https://www.googleapis.com/auth/gmail.send',
		'https://www.googleapis.com/auth/gmail.labels',
		'https://www.googleapis.com/auth/gmail.modify',
		'https://www.googleapis.com/auth/gmail.compose',
		'https://www.googleapis.com/auth/gmail.readonly',
	],
};

module.exports = {
	...config,
};
