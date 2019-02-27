/**Enter file description here */

/**Importing modules */

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const request = require('request');
const busboy = require('connect-busboy');
var bodyParser = require('body-parser');

/**Custom modules
 * connect.js : Business network connection and details.
 * mysql_connect.js : Mysql connection
 */
const {connect} = require('./connect');	
const {mysql_connect} = require('./mysql_connect');
const {con}=mysql_connect();

/**Environment variables */
const {
	HIE_IP,
	port,
	CLINIC_ID,
	sql_user, 
	sql_pass, 
	sql_db,
} = require('./config');
const dir_path = './ccda_store';	

/**Middleware */
app.use('/static', express.static('static'));
app.use(busboy());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));


let complete_path;
let fstream;
let res_obj = { status: 'file upload failed'};


app.post('/api/documents/request',handleCCDARequest);

async function handleCCDARequest(req,res){
	let latestCCDA = await createEMPIQuery(req,res);
	let search_path = await searchInStore(latestCCDA);
	res.sendFile(search_path);
}
async function searchInStore(latestCCDA){
	// call this fucntion as search
	// call two fucntions in here
	// 1 SearchinStore
	// 1 SearchinCache
	let search_path = path.join(__dirname,dir_path,latestCCDA.hash+".xml");
	try{
		fs.statSync(search_path);
		return search_path;
	}catch(err){
		console.log(err);
		if (err.code === 'ENOENT'){
			await requestCCDATransfer(latestCCDA);
		}
	}
}
async function requestCCDATransfer(latestCCDA){
	console.log(`target_clinic: ${latestCCDA.ownerId}`);
	let -target_hash = latestCCDA.hash;
	let target_clinic = latestCCDA.ownerId;
	
	/**
	 * MUST DO
	 * Create a mapping of target_clinic and ip
	 * This will be used to construct base_url
	 * For now assume that the IP of target clinic is 127.0.0.2
	 */
	
	
	const base_url = `http://127.0.0.1:${port}`;

	await submitStartTransferTransaction(target_hash, target_clinic);
	const url = base_url + `/api/documents/request`;
	const get_url = url + `?hash=${hash}`;

	/*
		TODO
		1. Use axios instead of request
		2. Await the get request
		3. Make xmlparsing and hash computing parallel using promises.all
	*/


}
async function submitStartTransferTransaction(hash, owner_id) {
	try {
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		console.log("after fetching");
		let options = {
			card: 'admin@ccda-transfer',
			data: `{
				"$class": "org.transfer.StartTransfer",
				"hash": "resource:org.transfer.CCDA#${hash}",
				"requesterId": "resource:org.transfer.Clinic#${CLINIC_ID}",
				"providerId": "resource:org.transfer.Clinic#${owner_id}"
			}`
		};
		//console.log(typeof hash)
		console.log("before submission");
		TransactionSubmit.handler(options);
		console.log("after submission");
	} catch (error) {
		console.log('uh-oh', error);
		// this.log.error(METHOD, 'uh-oh', error);
	}
}

async function createEMPIQuery(req,res){
	
	query = req.body;
	console.log(query);
	let number_of_fields = Object.keys(query).length;
	
	let patient_info_empty = false;
	console.log(patient_info_empty);
	let sql = "SELECT * FROM `EMPI` WHERE ";
	let i = 1;
	for (const key in query) {
		if (query[key]) {
			if (i != 1) {
				sql += "AND "
			}
			sql += `${key} LIKE '${query[key]}' `;			// Like used for case-insensitivity
			i++;
		}
		else{
			number_of_fields--;
			console.log(number_of_fields);
			
			if(number_of_fields===0){
				patient_info_empty = true;			
			}
		}
	}
	if(patient_info_empty){
		console.log("Empty query from Clinic");
		res.send("Your query is empty. Please try again with a valid query");
	}
	else{
		sql+=";";
		console.log(sql);
		const con = await mysql.createConnection({
			host: "localhost",
			user: "root",				// variable from .env does not work, why?
			password: sql_pass,
			database: sql_db,
			Promise: bluebird
		});
		let [rows, fields] = await con.execute(sql);
		const pat_id_from_EMPI = rows[0].Id;
		let latestCCDA = await getLatestCCDA(pat_id_from_EMPI);
		return latestCCDA;
	}
}

async function getLatestCCDA(pat_id){
	const {bizNetworkConnection,businessNetworkDefinition} = await connect();

	let query = bizNetworkConnection.buildQuery(`SELECT org.transfer.CCDA WHERE (patId=="resource:org.transfer.Patient#${pat_id}")`);
	let assets = await bizNetworkConnection.query(query);
	let max = assets[0];
	for(let i=0;i<assets.length;i++) {
		if(assets[i].lastUpdate>max.lastUpdate)
		max = assets[i];
	}
	console.log("after query");

	const asset_obj = {
		hash: max.hash,
		ownerId: max.ownerId.$identifier,
		patId: max.patId.$identifier,			// don't use this!!! - Relationship
		lastUpdate: max.lastUpdate,
	};
	console.log("Asset fetched from blockchain: ", asset_obj);

	return asset_obj;
}
	



async function handleUploadCCDA(req,res){
	req.pipe(req.busboy);
	req.busboy.on('file', await handleBusboyFile);
}

async function handleBusboyFile(fieldname, file, file_name){
	complete_path = path.join(__dirname, dir_path, file_name);
	fstream = fs.createWriteStream(complete_path);
	file.pipe(fstream);
	fstream.on('close',async function() {
		console.log("Upload Finished of: " + file_name);
		res_obj.status = `file: ${file_name}, was successfully stored`;
		let block_data = await preprocess(file_name);
		console.log(block_data);
		
		const hashed_file_name = path.join(__dirname, dir_path, block_data.hash+'.xml');
		
		fs.rename(complete_path, hashed_file_name, async function(err){
		if (err) {
			console.log(err);
		} else {
			console.log(`File successfully renamed`);
		}

		await addCCDA(block_data);
	});
 });}
async function addCCDA(block_data){
	const {bizNetworkConnection,businessNetworkDefinition} = await connect();
	
	try {
		let hash = block_data.hash;
		let patId = block_data.pat_id;
		let clinicId = block_data.clinic_id;
		let factory = businessNetworkDefinition.getFactory();
		
		let CCDA_Registry = await bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');

		// if asset exists, delete it			////// Just for the demo, don't deploy to production
		
		let assetExists = await CCDA_Registry.exists(hash);
		if (assetExists) {
			console.log("* Asset already exists, removing it");
			await CCDA_Registry.remove(hash);
			console.log("Asset removed");
		}
		// doesn't work when Asset does not exist.

		let newCCDA = factory.newResource('org.transfer', 'CCDA', hash);
		newCCDA.patId = factory.newRelationship('org.transfer', 'Patient', patId);
		newCCDA.ownerId = factory.newRelationship('org.transfer', 'Clinic', clinicId);
		newCCDA.lastUpdate = new Date();
		await CCDA_Registry.add(newCCDA);
		
		console.log("Block Data "+block_data);
		console.log("Hash of the file "+hash);
		console.log("Logged on the blockchain!!!!!!!!!!!!!!!!!!!!!!!!!!");
		return block_data;
	} catch (error) {
		console.log('* uh-oh', error);
		// this.log.error(METHOD, 'uh-oh', error);
	}	
}
async function preprocess(file_name){
	// console.log(`in preprocess file name is ${file_name}`);
	let block_data={};
	block_data.hash = await computeFileHash(file_name);
	console.log("Before XMLDATA");
	let xml_data = await getXmlData(file_name);

	console.log("After XMLDATA");
	block_data.clinic_id = xml_data.clinic_id;
	block_data.pat_id = xml_data.pat_id;
	return block_data; 
}
function getXmlData(file_name){
	return new Promise((resolve, reject) => {
		const parser = require('xml2json');
		fs.readFile( path.join(dir_path, `${file_name}`), function(err, data) {
			if (err) {
				console.log("*********** Err!!!");
				reject(err);
			} else {
				const options = {
					object: true,
				}
				
				console.log("Data read from the CCDA is:");

				const json = parser.toJson(data,options);
				const patInfo = json.ClinicalDocument.recordTarget.patientRole;
				console.log("Given Name: "+patInfo.patient.name.given);
				console.log("Family Name: "+patInfo.patient.name.family);
				console.log("Patient Id: "+patInfo.id.root);
				console.log("Clinic Name: "+patInfo.providerOrganization.name);
				console.log("Clinic Id: "+patInfo.providerOrganization.id.root);

				const ret_obj = {
					clinic_id: patInfo.providerOrganization.id.root,
					pat_id: patInfo.id.root,
				}

				resolve(ret_obj);
			}
		});
	});
}
async function computeFileHash(file_name){
	const crypto = require('crypto');
	const Q = require('q');

	const deferred = Q.defer();
	const file_path = path.join(__dirname, dir_path, file_name);
	let fd = fs.createReadStream(file_path);
	let hash = crypto.createHash('sha256');
	hash.setEncoding('hex');
	console.log(`Computing hash of ${file_path}`);
	fd.on('end', () => {
		hash.end();
		const computed_hash = hash.read()
		console.log('Hash of file is.. ', computed_hash); 
        deferred.resolve(computed_hash);
	});

	fd.pipe(hash);			// imp

	return deferred.promise;
}
app.post('/api/documents',handleUploadCCDA);

// Creation of EMPI




// app.listen(port, () => console.log(`Listening on port ${port}...`));
const http = require('http');
const server = http.createServer(app);
server.listen(port, HIE_IP, () => console.log(`${CLINIC_ID} is listening on ${HIE_IP}:${port} ...`));