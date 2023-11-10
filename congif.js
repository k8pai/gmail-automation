/**
 * Returns all the unread thread after the specificied Vaccation period;
 *
 * @param {gmail_v1.Gmail} labelName Messages are appended to this label.
 * @param {Date['toLocaleDateString']} vaccationStarts Date which you want to check for messages that are unread and from `vaccationStarts`.
 */
const config = {
	labelName: 'VACCATION',
	vaccationStarts: '11/10/2023',
	interval: 8000,
};

module.exports = {
	...config,
};
