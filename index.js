const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const base64 = require('base64-js');
const {
	appendLabel,
	listLabels,
	checkLabel,
	createLabel,
} = require('./controllers/label.controller');

let lastCheckTimeStamp = new Date().toLocaleDateString();

// const labelName = 'VACCATION';
let labelId = null;

// If modifying these scopes, delete token.json.
const SCOPES = [
	'https://mail.google.com/',
	'https://www.googleapis.com/auth/gmail.send',
	'https://www.googleapis.com/auth/gmail.labels',
	'https://www.googleapis.com/auth/gmail.modify',
	'https://www.googleapis.com/auth/gmail.compose',
	'https://www.googleapis.com/auth/gmail.readonly',
];
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
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	});
	if (client.credentials) {
		await saveCredentials(client);
	}
	return client;
}

const getUnreadThreads = async (gmail) => {
	const listThreads = await gmail.users.threads.list({
		userId: 'me',
		q: `is:unread after:${lastCheckTimeStamp}`,
	});

	// console.log('data found ', listThreads.data.resultSizeEstimate);
	if (
		listThreads.data.resultSizeEstimate === 0 ||
		!listThreads.data.threads
	) {
		console.log('no new mails are found after ', lastCheckTimeStamp);
		return [];
	}

	return listThreads.data.threads;
};

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
		// messages.map((message) => {
		// 	console.log(message);
		// });
		filteredThreads.push(thread);
		filterMessages.push({
			...messages[messages.length - 1],
			snippet: messages[0].snippet,
		});
	}
	return { messages: filterMessages, threads: filteredThreads };
};

const getFromAddress = (headers) => {
	let res = headers.find(({ name, value }, _) => name === 'From');

	// console.log('send response to: ', res);
	return res.value;
};

function makeBody(to, from, subject, message) {
	const str = `Content-Type: text/plain; charset="UTF-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
to: ${to}
from: ${from}
subject: ${subject}


${message}`;

	const encodedBody = base64.fromByteArray(Buffer.from(str));
	return encodedBody.replace(/\+/g, '-').replace(/\//g, '_');
}

const sendMail = async (auth, messages) => {
	const gmail = google.gmail({ version: 'v1', auth });
	for (const message of messages) {
		// Get the email's subject and body
		const { id, snippet: subject, to: sendTo } = message;

		const body = await gmail.users.messages
			.get({
				userId: 'me',
				id,
			})
			.then((response) => response.data);

		console.log(body);

		// Compose a reply email
		const replyOptions = {
			from: 'me',
			to: sendTo,
			subject: `RE: ${subject}`,
			text: `Hey,\n\nI'm on my vaccations.\n\nI'll ping you when i'm back...\n\n`,
		};

		const requestBody = {
			raw: makeBody(sendTo, 'me', `RE: ${subject}`, replyOptions.text),
		};

		// Send the reply email
		gmail.users.messages.send({
			userId: 'me',
			requestBody,
		});
	}
};

authorize()
	.then(async (auth) => {
		let interval = 10000;
		const gmail = google.gmail({ version: 'v1', auth });

		// Check the label and return the label id of the label if present...
		labelId = await checkLabel(gmail);

		// If there's no labelId is found after check, then create a new label and store the label id in it.
		if (!labelId) {
			console.log(
				'Label was not found and we are going to create the label for now...',
			);
			labelId = await createLabel(gmail);
		} else {
			console.log('label already exist....');
		}

		setInterval(async () => {
			console.log('Interval marked');

			// const threads = await getUnreadThreads(gmail);
			// const filteredThreads = await filterNoPriorReplies(
			// 	gmail,
			// 	threads.slice(0, 10),
			// );

			// await sendMail(auth, filteredThreads.messages);
			await appendLabel(gmail, labelId, []);
		}, interval);
	})
	.catch(console.error);
