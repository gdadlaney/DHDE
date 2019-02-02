# Decentralized-Healthcare-Data-Exchange
A Healthcare Data Exchange that enables exchange of patient health records, particularly CCDAs between EHRs using blockchain. Since, the data is exchanged in a decentralized way, any EHR from any location can join the exchange network. The system is designed to be a decentralized alternative to the centralized HIE system in the US.

### Steps to run the ehr-hie file upload
1. Clone the repo(check git_instructions.md) & run `npm install` (only once) inside the dir.
2. Delete the `sample.xml` file in `hie_dir/` (if present).
3. Run `nodemon hie.js` to start the express server.
4. Run `node dummy\ ehr.js` to start transfer of the sample.xml file.
5. Check the console logs and hie_dir/ to see the result.

#### Please read the contributing.md file before making any contribution.
