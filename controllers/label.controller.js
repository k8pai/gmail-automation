const { labelName } = require('../congif');

/**
 * Lists the labels in the user's account.
 *
 * @param {gmail_v1.Gmail} gmail A Gmail API client.
 * @param {config} config An Object that contains configuration variables.
 */
const listLabels = async (gmail, config) => {
	const res = await gmail.users.labels.list({
		userId: 'me',
	});
	const labels = res.data.labels;
	if (!labels || labels.length === 0) {
		console.log('No labels found.');
		return;
	}
	// console.log('Labels:');
	// labels.forEach((label) => {
	// 	console.log(
	// 		`- ${label.name} ${label.name === labelName ? label.id : null}`,
	// 	);
	// });

	for (const label of labels) {
		if (label.name === labelName) {
			config.labelId = label.id;
		}
	}

	config.isLabelPresent = labels
		.map((label) => {
			return label.name;
		})
		.includes(labelName);
};

/**
 * Checks and returns the id of the label if it exists.
 *
 * @param {gmail_v1.Gmail} gmail A Gmail API client.
 */
const checkLabel = async (gmail) => {
	const res = await gmail.users.labels.list({
		userId: 'me',
	});
	const labels = res.data.labels;
	if (!labels || labels.length === 0) {
		console.log('No labels found.');
		return null;
	}

	for (const label of labels) {
		if (label.name === labelName) {
			return label.id;
		}
	}
	return null;
};

/**
 * Create A labels in the user's account.
 *
 * @param {gmail_v1.Gmail} gmail A Gmail API client.
 */
const createLabel = async (gmail) => {
	const res = await gmail.users.labels.create({
		userId: 'me',
		requestBody: {
			labelListVisibility: 'labelShow',
			messageListVisibility: 'show',
			name: labelName,
		},
	});

	if (res.status === 200) {
		console.log(`Successfully created Label - ${labelName}`);
		return res.data.id;
	}

	return null;
	// console.log('res => ', res);
};

/**
 * Appends the label provided to the given messages.
 *
 * @param {gmail_v1.Gmail} gmail A Gmail API client.
 * @param {gmail_v1.Schema$Message[]} messages Messages array that contains a list of messages which has to appended with the label `labelId`
 */
const appendLabel = async (gmail, labelId, messages = []) => {
	messages?.map(async ({ id }) => {
		await gmail.users.messages.modify({
			userId: 'me',
			id,
			requestBody: {
				addLabelIds: [labelId],
			},
		});
	});
};

module.exports = {
	appendLabel,
	listLabels,
	createLabel,
	checkLabel,
};
