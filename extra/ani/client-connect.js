'use strict';

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const Table = require('cli-table');
// const winston = require('winston');
const prettyjson = require('prettyjson');

// these are the credentials to use to connect to the Hyperledger Fabric
let cardname = 'admin@ccda-transfer';

// const LOG = winston.loggers.get('application');


/** Class for the land registry*/
class CCDA_Transfer {
    /**
    * Need to have the mapping from bizNetwork name to the URLs to connect to.
    * bizNetwork nawme will be able to be used by Composer to get the suitable model files.
    *
    */
    constructor() {
        this.bizNetworkConnection = new BusinessNetworkConnection();
        this.businessNetworkDefinition = null;
        // init();
        // ( async() => {
        //     this.businessNetworkDefinition = await this.bizNetworkConnection.connect(cardname);
        // })
    }

    // /** 
    // * @description Initalizes the LandRegsitry by making a connection to the Composer runtime
    // * @return {Promise} A promise whose fullfillment means the initialization has completed
    // */
    async initFunc() {
        if (this.businessNetworkDefinition == null) {
            console.log("Before the connection");
            this.businessNetworkDefinition = await this.bizNetworkConnection.connect(cardname);
            console.log("Connected");
        }
        else console.log("Already connected");
        // LOG.info('CCDA_Registry:<init>', 'businessNetworkDefinition obtained', this.businessNetworkDefinition.getIdentifier());
    }

   /** 
    * Listen for the sale transaction events
    */
    listen() {
        this.bizNetworkConnection.on('event', (evt) => {
            console.log(chalk.blue.bold('New Event'));
            console.log(evt);

            let options = {
                properties: { key:'value'}
            };
        });
    }

    

    /** 
    * Updates a fixes asset for selling..
    * @return {Promise} resolved when this update has completed
    */
    async runTransaction(trans_name) {
        console.log("Checking connection");
        await this.initFunc();

        // const METHOD = 'updateForSale';
        // let registry = await this.bizNetworkConnection.getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle');
        // LOG.info(METHOD, 'Getting assest from the registry.');
        // let result = registry.get('LID:1148');
        let factory        = this.businessNetworkDefinition.getFactory();
        let transaction    = factory.newTransaction('org.transfer', trans_name);
        // transaction.title  = factory.newRelationship('net.biz.digitalPropertyNetwork', 'LandTitle', 'LID:1148');
        // transaction.seller = factory.newRelationship('net.biz.digitalPropertyNetwork', 'Person', 'PID:1234567890');

        console.log("Before submitting the transaction");
        // LOG.info(METHOD, 'Submitting transaction');
        await this.bizNetworkConnection.submitTransaction(transaction);
        console.log("Transaction successfully submitted");
    }

    
     /**
    * List the land titles that are stored in the Land Title Resgitry
    * @return {Table} returns a table of the land titles.
    */
    async listParticipants(p_name) {
        // await init();
        console.log("Checking connection");
        await this.initFunc();

        const METHOD = 'listCCDAs';

        // let CCDA_Registry;
        let ParticipantRegistry;

        // LOG.info(METHOD, 'Getting the asset registry');
        // get the land title registry and then get all the files.

        try {
            // console.log("Before getting the asset registry");
            // let CCDA_Registry = await this.bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');
            console.log("Before getting the Participant registry");
            let ParticipantRegistry = await this.bizNetworkConnection.getParticipantRegistry('org.transfer.'+p_name);
            console.log(`Before getting/resolving the resources from ${p_name} registry`);
            let aResources = await ParticipantRegistry.resolveAll();
            console.log(aResources);
            // console.log("----------------");
            // console.log(aResources[0].clinicId);
            // console.log(aResources[0].name);
            
            // LOG.info(METHOD, 'Getting all assest from the registry.');
            // console.log("Before getting/resolving the resources from CCDA registry");
            // let aResources = await CCDA_Registry.resolveAll();
            // LOG.info(METHOD, 'Current CCDA Attributes');
            // let table = new Table({
            //     head: ['mrn', 'patId', 'ehrId', 'docId', 'lastUpdate', 'owner']
            // });
            // let arrayLength = aResources.length;

            // for (let i = 0; i < arrayLength; i++) {

            //     let tableLine = [];
            //     console.log(aResources);
            //     console.log("HI");
            //     tableLine.push(aResources[i].mrn);
            //     tableLine.push(aResources[i].Patient.patId);
            //     // tableLine.push(aResources[i].owner.firstName);
            //     // tableLine.push(aResources[i].owner.lastName);
            //     // tableLine.push(aResources[i].information);
            //     // tableLine.push(aResources[i].forSale ? 'Yes' : 'No');
            //     table.push(tableLine);
            // }
            // // Put to stdout - as this is really a command line app
            // return table;
        } catch(error) {
            console.log(error);
            this.log.error(METHOD, 'uh-oh', error);
        }
    }

    async listCCDAs() {
        // await init();
        console.log("Checking connection");
        await this.initFunc();

        const METHOD = 'listCCDAs';

        let CCDA_Registry;
        let ClinicRegistry;

        // LOG.info(METHOD, 'Getting the asset registry');
        // get the land title registry and then get all the files.

        try {
            console.log("Before getting the asset registry");
            let CCDA_Registry = await this.bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');
            console.log("Before getting the Participant registry");
            let ClinicRegistry = await this.bizNetworkConnection.getParticipantRegistry('org.transfer.Clinic');
            console.log("Before getting/resolving the resources from Clinic registry");
            let aResources = await ClinicRegistry.resolveAll();
            // console.log(aResources);
            // console.log("----------------");
            // console.log(aResources[0].clinicId);
            // console.log(aResources[0].name);
            
            // LOG.info(METHOD, 'Getting all assest from the registry.');
            // console.log("Before getting/resolving the resources from CCDA registry");
            // let aResources = await CCDA_Registry.resolveAll();
            // LOG.info(METHOD, 'Current CCDA Attributes');
            // let table = new Table({
            //     head: ['mrn', 'patId', 'ehrId', 'docId', 'lastUpdate', 'owner']
            // });
            // let arrayLength = aResources.length;

            // for (let i = 0; i < arrayLength; i++) {

            //     let tableLine = [];
            //     console.log(aResources);
            //     console.log("HI");
            //     tableLine.push(aResources[i].mrn);
            //     tableLine.push(aResources[i].Patient.patId);
            //     // tableLine.push(aResources[i].owner.firstName);
            //     // tableLine.push(aResources[i].owner.lastName);
            //     // tableLine.push(aResources[i].information);
            //     // tableLine.push(aResources[i].forSale ? 'Yes' : 'No');
            //     table.push(tableLine);
            // }
            // // Put to stdout - as this is really a command line app
            // return table;
        } catch(error) {
            console.log(error);
            this.log.error(METHOD, 'uh-oh', error);
        }
    }
    /*async get_data()
    
        try {
            // Get the vehicle asset registry.
           return getAssetRegistry('org.example.Vehicle')
          .then(function (Id) {
           // Get the specific vehicle from the vehicle asset registry.
        return assetRegistry.get('9884');
           })
          .then(function (ccda) {
           // Process the the vehicle object.
        console.log(ccda);
            })
            .catch(function (error) {
        // Add optional error handling here.
          }); */
          /*  
          let CCDA_Registry = await this.bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');
          let aResources = await CCDA_Registry.get('9884');
          console.log(aResources.hash);
          console.log(aResources.lastUpdate);
          console.log(aResources.patId.$idenifier);
          console.log(aResources.ownerId.$identifier);
        } catch (error) {
            console.log(error);
            this.log.error(METHOD, 'uh-oh', error);
        }
    }*/
    async StartTransfer()
    {
        try {

          //  let factory    = this.businessNetworkDefinition.getFactory();
        //let transaction    = factory.newTransaction('org.transfer', trans_name);


          let CCDA_Registry = await this.bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');
          let aResources = await CCDA_Registry.get('AP48');
          let hash =aResources.hash;
          let lastUpdate= aResources.lastUpdate;
          let patient=aResources.patId.$idenifier;
          let owner=aResources.ownerId.$identifier;
           let TransactionSubmit = require('composer-cli').Transaction.Submit;
            console.log("after fetching");
            let options = {
                card: 'admin@ccda-transfer',
                data: `{
                    "$class": "org.transfer.StartTransfer",
                    "hash": "resource:org.transfer.CCDA#${hash}",
                    "requesterId": "resource:org.transfer.Clinic#CRC",
                    "providerId": "resource:org.transfer.Clinic#${owner}"}`
            };
            //console.log(typeof hash)
            console.log("before submission");
          TransactionSubmit.handler(options);
          console.log("after submission");
        } catch (error) {
            console.log(error);
            this.log.error(METHOD, 'uh-oh', error);
        }

    }
    async getlatestdata()
    {
//             // Build a query.
//          var q = buildQuery('SELECT org.example.sample.SampleAsset WHERE (value == _$inputValue)');
// // Execute the query.
// return query(q, { inputValue: 'blue' })
//   .then(function (assets) {
//     assets.forEach(function (asset) {
//       // Process each asset.
//     });
//   })
//   .catch(function (error) {
//     // Add optional error handling here.
//   });
// let now = new Date();
// now.setMinutes(10);  // set the date to be time you want to query from

// let q1 = businessNetworkConnection.buildQuery('SELECT org.hyperledger.composer.system.HistorianRecord.hash' +
//                                               'WHERE (transactionTimestamp > _$justnow)');   

// await businessNetworkConnection.query(q1,{justnow:now});
       let now = new Date();
      
       //now.setMinutes(10);
       let CCDA_Registry = await this.bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');
       let aResources = await CCDA_Registry.getAll();
       //console.log(aResources);
       console.log("in getdatafunc");
       let query = this.bizNetworkConnection.buildQuery('SELECT org.transfer.CCDA WHERE (patId=="resource:org.transfer.Patient#AP49")');
       let assets = await this.bizNetworkConnection.query(query);
       let max = assets[0];
       for(let i=0;i<assets.length;i++)
       {
           
           if(assets[i].lastUpdate>max.lastUpdate)
           max=assets[i];
          
       }
       console.log(max.hash);
       console.log("after query");

    }

}

async function my_main() {
    const obj = new CCDA_Transfer();
    
    await obj.listParticipants('Clinic');
    await obj.runTransaction('Purge');
    await obj.listParticipants('Clinic');
   // await obj.get_data();
    await obj.submitTransaction();
    console.log('Function complete');
}

async function my_main_after_restart() {
    const obj = new CCDA_Transfer();
    
    await obj.runTransaction('Purge');
    await obj.runTransaction('SetupDemo');
    await obj.listParticipants('Clinic');
    //await obj.StartTransfer();
    await obj.getlatestdata();
    await obj.runTransaction('Purge');
    //await obj.listParticipants('Clinic');
    console.log('Function complete');
}

// obj.init();
// obj.runTransaction('Purge')
// obj.runTransaction('SetupDemo')
// obj.listParticipants('Clinic')
// .then(() => obj.runTransaction('SetupDemo'))
// .then(() => obj.listCCDAs())
// .then(() => console.log("Program complete"));
// obj.runTransaction('SetupDemo');

// obj.listCCDAs();

//my_main()
 my_main_after_restart()
.then(() => console.log("Program complete"));