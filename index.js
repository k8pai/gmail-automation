const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const {
	appendLabel,
	checkLabel,
	createLabel,
} = require('./controllers/label.controller');
const { getFromAddress } = require('./lib/helpers');
const { getUnreadThreads } = require('./controllers/thread.controller');
const { sendMail } = require('./controllers/message.controller');
const { interval, vaccationStarts, scopes } = require('./config');

// Global variable for storing label id of the token that we are about to create.
let labelId = null;

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content);
		return google.auth.fromJSON(credentials);
	} catch (err) {
		return null;
	}
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
	const content = await fs.readFile(CREDENTIALS_PATH);
	const keys = JSON.parse(content);
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: 'authorized_user',
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
	let client = await loadSavedCredentialsIfExist();
	if (client) {
		return client;
	}
	client = await authenticate({
		scopes,
		keyfilePath: CREDENTIALS_PATH,
	});
	if (client.credentials) {
		await saveCredentials(client);
	}
	return client;
}

/**
 * Returns all the unread thread after the specificied Vaccation period;
 *
 * @param {gmail_v1.Gmail} gmail A Gmail API client.
 * @param {gmail_v1.Schema$Thread[]} threads Threads.
 * @return {Promise<{messages: gmail_v1.Schema$Message[], threads: gmail_v1.Schema$Thread[]}>} Returns the list of threads that are unread and came inbox after specific timestamp.
 */
const filterNoPriorReplies = async (gmail, threads) => {
	let filteredThreads = [],
		filterMessages = [];
	for (const thread of threads) {
		// console.log('considering ', thread.id);
		const response = await gmail.users.threads.get({
			userId: 'me',
			id: thread.id,
		});

		let isFirstMessageSentByMe =
			response.data.message?.[0].labelIds.includes('SENT');
		// console.log(
		// 	'Did i send the first message? ',
		// 	isFirstMessageSentByMe ? 'yes' : 'no',
		// );

		if (isFirstMessageSentByMe) {
			continue;
		}

		let messages = response.data.messages.map((message) =>
			message.labelIds.includes('SENT')
				? true
				: {
						id: message.id,
						snippet: message.snippet,
						to: getFromAddress(message.payload.headers),
						payload: message.payload,
				  },
		);
		let isRepliedByMe = messages.includes(true);
		// console.log(
		// 	'Did i Reply for this thread? ',
		// 	isRepliedByMe ? 'yes' : 'no',
		// );

		if (isRepliedByMe) {
			continue;
		}

		// response.data.messages.map((message) => console.log(message));

		filteredThreads.push(thread);
		filterMessages.push({
			...messages[messages.length - 1],
			snippet: messages[0].snippet,
		});
	}
	return { messages: filterMessages, threads: filteredThreads };
};

async function main() {
	// Authenticating the user.
	const auth = await authorize()
		.then((client) => client)
		.catch((error) => error);

	// initializing the gmail client.
	const gmail = google.gmail({ version: 'v1', auth });

	// timestamp for the start of the vaccation or take directly from `./config.js`
	let timestamp = new Date('10/05/2023').toLocaleDateString();

	setInterval(async () => {
		// Check the label and return the labelId of the label if present...
		labelId = await checkLabel(gmail);

		// If there's no labelId is found after check, then create a new label and store the label id in it.
		if (!labelId) {
			labelId = await createLabel(gmail);
		}

		// logs
		console.log(`Running checks: ${new Date().toLocaleTimeString()}`);

		// Gets Threads those are unread From the start of the Vaccation Date.
		const unreadThreads = await getUnreadThreads(gmail, vaccationStarts);

		// Filtering Messages to satisfy
		// - no prior email has been sent by you.
		// - should be replied back with one and only one auto reply.
		const { messages, threads } = await filterNoPriorReplies(
			gmail,
			unreadThreads,
		);

		// logs when new messages are found
		if (messages.length) {
			console.log(`Found ${messages.length} New UnRead Mails.`);
		}

		// iterating through all the new messages found.
		// - Sends a reply for each message found.
		// - Appends each message under the label.
		for (const message of messages) {
			await sendMail(gmail, message);
			await appendLabel(gmail, labelId, message);
		}
	}, interval); // defined in config.js
}

main();
