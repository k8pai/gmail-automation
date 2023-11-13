## gmail-automation

A powerful tool for automating your Gmail tasks, including:

-   **Login with Google authentication:** Seamlessly connect to your Gmail account using OAuth credentials.
-   **Sending automated replies:** Craft personalized replies to incoming emails based on specific criteria.
-   **Adding labels to incoming mails:** Organize your inbox by automatically assigning labels to incoming messages based on sender, subject, or content.

### Folder Structure

The project's folder structure is organized to promote clarity and maintainability:

```
│   .gitignore
│   config.js
│   credentials.json
│   index.js
│   package.json
│   README.md
│
├───controllers
│       label.controller.js
│       message.controller.js
│       thread.controller.js
│
└───lib
        helpers.js
```

### Installation

To get started with gmail-automation, follow these simple steps:

1. **Install Dependencies:** Ensure you have Node.js installed on your system. Then, navigate to the project directory and run `npm install` to install the necessary dependencies.

2. **Obtain Credentials:** Follow the documentation link [here] to set up an OAuth Client and generate the required credentials. Save the credentials in a JSON file named `credentials.json`.

3. **Configure Settings:** Edit the `config.js` file to customize the automation settings, including the label name for unread messages, vacation start date, checking interval, and OAuth scopes.

4. **Run the Automation:** Execute the script using the command `npm run dev`. The automation will start processing incoming emails based on the configured settings.

### Setting Up Config Options

The `config.js` file provides various options to customize the automation behavior:

-   `labelName`: Specify the label name to which unread messages should be appended.

-   `vaccationStarts`: Define the date from which unread messages should be processed. Format: 'mm/dd/yyyy'.

-   `interval`: Set the interval in milliseconds for checking incoming messages.

-   `scopes`: Define the OAuth scopes required for the automation to access Gmail functionalities.

### Features

The gmail-automation tool offers a range of features to streamline your Gmail management:

-   **Automated Replies:** Send personalized replies to incoming emails based on specific criteria, such as sender, subject, or content.

-   **Label Assignment:** Automatically assign labels to incoming messages based on sender, subject, or content, improving organization and searchability.

-   **Error Handling:** Gracefully handle errors that may occur during the automation process, ensuring the script's stability and reliability.
