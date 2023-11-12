/**
 * Returns all the unread thread after the specificied Vaccation period;
 *
 * @param {gmail_v1.Gmail} gmail A Gmail API client.
 * @param {gmail_v1.Schema$Message[]} timestamp Messages array that contains a list of messages for which we have to provide replies.
 * @return {Promise<gmail_v1.Schema$Thread[]>} Returns the list of threads that are unread and came inbox after specific timestamp.
 */
const getUnreadThreads = async (gmail, timestamp) => {
	const listThreads = await gmail.users.threads.list({
		userId: 'me',
		q: `is:unread after:${timestamp}`,
	});

	// console.log('data found ', listThreads.data.resultSizeEstimate);
	let threads = listThreads.data.threads;
	if (listThreads.data.resultSizeEstimate === 0 || !threads) {
		// console.log(`is:unread after:${timestamp} returns []`);
		return [];
	}

	return threads;
};

module.exports = { getUnreadThreads };
