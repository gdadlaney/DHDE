const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
let bizNetworkConnection, businessNetworkDefinition = null

async function connect() {
	if (businessNetworkDefinition == null) {
		/////////////// also submit the Purge + SetupDemo transaction along with the connection
		/////////////// needs another tansaction - SetupAsset
		const cardname = 'admin@ccda-transfer';
		bizNetworkConnection = await new BusinessNetworkConnection();
        businessNetworkDefinition = await bizNetworkConnection.connect(cardname);
	} else console.log("Already connected");

	return {bizNetworkConnection,businessNetworkDefinition};
}

module.exports = {
    connect
};