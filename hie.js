/**Enter file description here */

/**Importing modules */

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const request = require('request');
const busboy = require('connect-busboy');
var bodyParser = require('body-parser');
const ls = require('log-symbols');


/*Auditing the Historian*/
const prettyoutput = require('prettyoutput')

/*
	UI
*/
// const layout = require('express-layout')
// app.set('views', path.join(__dirname, 'views'))
// const middleware = [
//   layout(),
//   express.static(path.join(__dirname, 'public')),
// ]
// app.use(middleware)


/**Custom modules
 * connect.js : Business network connection and details.
 * mysql_connect.js : Mysql connection
 */
const { connect } = require('./connect');
const { mysql_connect } = require('./mysql_connect');

/**Environment variables */
const {
	HIE_IP,
	port,
	CLINIC_ID,
	sql_user,
	sql_pass,
	sql_db,
} = require('./config');

const ccda_store_path = './ccda_store';
const ccda_cache_path = './ccda_cache';

/**Middleware */
app.use('/static', express.static('static'));
app.use(busboy());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


let complete_path;
let fstream;
let res_obj = { status: 'file upload failed' };


app.get('/api/documents', handleCCDARequest);

async function handleCCDARequest(req, res) {
	// 1. Get metadata to identify the CCDA
	console.log(ls.info, "Fetching patient_id from EMPI");
	let pat_id = await createEMPIQuery(req, res);
	console.log(ls.info, "Patient id is :"+pat_id);

	console.log(ls.info, `Fetching the latest CCDA of ${pat_id} from the blockchain`);
	let latest_CCDA_obj = await getLatestCCDA(pat_id);						// try-catch may be better 
	if (latest_CCDA_obj === null) {
		console.log(ls.err, "No records found on the blockchain for the given patient");
		res.status(404).send("No records found on the blockchain for the given patient");
		return;			////////
	}

	// 2. Get the CCDA
	let ret_obj = await searchInLocal(latest_CCDA_obj);
	let abs_file_path = ret_obj.abs_file_path;
	if (ret_obj.hashVerified === false) {
		console.log(ls.info, "CCDA not found locally. CCDA needs to be requested from another clinic"); 					// file not found
		const {abs_file_path, StartTransferTimeId} = await requestCCDATransfer(latest_CCDA_obj);
	
		if (abs_file_path === null) 
			console.log(ls.error,"requestCCDATransfer() failed in some uncertain way!!! ");		// this should never fire - put in catch
		else
			await submitLocalAccessTransaction(latest_CCDA_obj.patId, latest_CCDA_obj.hash, latest_CCDA_obj.ownerId, StartTransferTimeId, req.query['DocId'], req.query['DocName']);
	}
	else{

		await submitLocalAccessTransaction(latest_CCDA_obj.patId, latest_CCDA_obj.hash, latest_CCDA_obj.ownerId, null, req.query['DocId'], req.query['DocName']);
	}
	if (abs_file_path !== null)
		res.sendFile(abs_file_path);				// handle callback
	else
		res.status(404).send("File not found OR was corrupt");
}

async function searchInLocal(latest_CCDA_obj) {
	const file = latest_CCDA_obj.hash+".xml";
	let ret_obj = { abs_file_path: null, hashVerified: false };
	let foundInStore = false;
	let computed_hash = null;

	// 1. searchInStore
	ret_obj.abs_file_path = searchInDir(file, ccda_store_path);
	
	if (ret_obj.abs_file_path !== null) {
		console.log(ls.success, "CCDA found in CCDA_Store");
		foundInStore = true;
	} else {	
		console.log(ls.warning, "CCDA not found in CCDA_Store");

		// 2. searchInCache
		ret_obj.abs_file_path = searchInDir(file, ccda_cache_path);
	}
	
	if (ret_obj.abs_file_path !== null) 
		console.log(ls.success, "CCDA found in CCDA_Cache");
	else
		console.log(ls.warning, "CCDA not found in CCDA_Cache");

	
	// 3. hashCheck
	if (ret_obj.abs_file_path !== null) 
		if (foundInStore)
			computed_hash = await computeFileHash(file, ccda_store_path);
		else
			computed_hash = await computeFileHash(file, ccda_cache_path);
	if (latest_CCDA_obj.hash != computed_hash) {
		console.log(ls.warning, "Hash Check Failed");
		// delete file
		ret_obj.hashVerified = false;
	}
	else {
		console.log(ls.success, "Hash Verified");
		ret_obj.hashVerified = true;
	}

	return ret_obj;
}

function searchInDir(file, dir) {
	let search_path = path.join(__dirname, dir, file);
	try {
		fs.statSync(search_path);			// make async & wrap in Promises?
		return search_path;
	} catch (err) {
		if (err.code === 'ENOENT')		// file not found
			return null;		
		else 
			console.error(err);	
	}
}

async function requestCCDATransfer(latest_CCDA_obj) {
	console.log(ls.info,`Id of target_clinic: ${latest_CCDA_obj.ownerId}`);
	
	console.log("latest_ccda_obj", latest_CCDA_obj);
	const target_patId = latest_CCDA_obj.patId;
	const target_hash = latest_CCDA_obj.hash;
	const target_clinic = latest_CCDA_obj.ownerId;
	let req_success = true;
	let err_msg = '';

	console.log(`Requesting: ${latest_CCDA_obj.ownerId} for CCDA transfer`);
	let StartTransferTimeId = await submitStartTransferTransaction(target_patId, target_hash, target_clinic);
	// let StartTransferTimeId = new Date().toISOString()
	console.log(ls.success,"Request logged on the blockchain");

	let abs_path = await getFile(target_hash, target_clinic);
	
	if (abs_path === null) {
		req_success = false;
		err_msg = 'File requested from clinic was either missing OR corrupt';
	}

	await submitFinishTransferTransaction(target_patId, target_hash, target_clinic, StartTransferTimeId, req_success, err_msg);
	return {abs_path, StartTransferTimeId};
}

async function getFile(target_hash, target_clinic) {
	const { con } =  await mysql_connect();

	sql = `SELECT * from DNS WHERE Clinic_Id='${target_clinic}';`;
	let [rows, fields] = await con.execute(sql);
	let target_clinic_ip = rows[0].Clinic_IP;
	// if rows[1] exists, throw an err

	const base_url = `http://${target_clinic_ip}:${port}`;

	const url = base_url + `/${target_clinic}/api/documents/`;
	const get_url = url + `?hash=${target_hash}`;				// use route params instead of query params

	console.log(get_url)

	return new Promise((resolve, reject) => {
		request.get(get_url, function(err, resp, body) {
			if (err) {
				console.log(ls.error,`Error: ${err}`);
				reject(err);
			}
			else {
				if (resp.statusCode == 404 || resp.statusCode == 400 || resp.statusCode == 409)
					console.error(body);
				else {
					const abs_path = path.join(__dirname, ccda_cache_path, target_hash+'.xml');
					fs.writeFile(abs_path, body, function(err, data) {	// we shouldn't change the name of the file if the mrn isn't unique
						if (err)
							console.error(err);
						else {
							console.log(ls.success, "Recieved requested CCDA");
							computeFileHash(target_hash+'.xml', ccda_cache_path)
							.then( (received_file_hash) => {
								if ( target_hash !== received_file_hash ) {
									console.log(ls.error, "Hash Check Failed");
									// delete the file
									resolve(null);
								} else {
									console.log(ls.success, 'Hash verified.');
									resolve(abs_path);
								}
							});
						}
					});
				}
			}
		});
	});
}

app.get(`/${CLINIC_ID}/api/documents/?`, handleCCDATransfer);

async function handleCCDATransfer(req, res) {

	// check transaction (identified by hash)

	// req.query is a dict with all query params
	const requested_hash = req.query['hash'];
	const hash_path = path.join(__dirname, ccda_store_path, requested_hash+".xml");

	try {
		fs.statSync(hash_path);		// using statSync instead of readdirSync, as we just need to check if file is present.
		
		let hash_found = await computeFileHash(`${requested_hash}.xml`, ccda_store_path);
		if (requested_hash != hash_found) {
			console.log("Hash Check Failed");
			res.status(409).send("Hash Check Failed");
		}
		else {
			res.sendFile(hash_path);		// convenient method
			console.log(`File: ${hash_found+".xml"} found & send back successfully`);
		}
	}
	catch (err) {
		console.error('Error in file lookup: ', err);
		if (err.code === 'ENOENT')
			res.status(404).send(`File: ${hash_found+".xml"} does not exist in CCDA Store`);		// 404 : Not FOund
		else
			res.status(400).send(err);			// 400: Bad Request
	}
}

async function submitLocalAccessTransaction(patId, hash, owner_id, start_timestamp, docId, docName) {

	try {
		if(!start_timestamp){
			start_timestamp = new Date();
		}
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		
		let options = {
			card: 'admin@ccda-transfer',
			data: `{
				"$class": "org.transfer.LocalAccess",
				"patId": "resource:org.transfer.Patient#${patId}",
				"hash": "resource:org.transfer.CCDA#${hash}",
				"requesterId": "resource:org.transfer.Clinic#${CLINIC_ID}",
				"providerId": "resource:org.transfer.Clinic#${owner_id}",
				"StartTransId": "${start_timestamp}",
				"docId": "${docId}",
				"docName": "${docName}"
			}`
			
		};
		TransactionSubmit.handler(options);
	} catch (error) {
		console.error('Error in submitting Local Access transaction:', error);
	}
}

async function submitStartTransferTransaction(patId, hash, owner_id) {
	let my_date = new Date();
	
	try {
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		
		my_date = my_date.toISOString();
		
		let options = {
			card: 'admin@ccda-transfer',
			data: `{
				"$class": "org.transfer.StartTransfer",
				"patId": "resource:org.transfer.Patient#${patId}",
				"hash": "resource:org.transfer.CCDA#${hash}",
				"requesterId": "resource:org.transfer.Clinic#${CLINIC_ID}",
				"providerId": "resource:org.transfer.Clinic#${owner_id}",
				"timestampId": "${my_date}"
			}`,
		};
		// console.log("start: ", options)
		TransactionSubmit.handler(options);
	} catch (error) {
		console.error('Error in submitting Final Transfer transaction:', error);
	}

	return my_date;
}

async function submitFinishTransferTransaction(patId, hash, owner_id, start_timestamp, success_flag, err_msg) {
	const { bizNetworkConnection, businessNetworkDefinition } = await connect();
	
	try {
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		
		// Method 1. Query the id, using timestamp. Timing issues.
		//     console.log(date)
     
    //     let q1 = await bizNetworkConnection.buildQuery(
    //         `SELECT org.hyperledger.composer.system.HistorianRecord
    //           WHERE (transactionType == 'org.transfer.StartTransfer' AND transactionTimestamp == '${date}')`
    //     );      
		// let record = await bizNetworkConnection.query(q1);
		// // if (record is empty) throw error
					
		// Method 2. Make the timestamp the common id
		// start_timestamp acts as a link between all 3 transcations

		if (!err_msg)				// if undefined or null
			err_msg = null		// json only accepts null

		let options = {
			card: 'admin@ccda-transfer',
			data: `{
				"$class": "org.transfer.FinishTransfer",
				"patId": "resource:org.transfer.Patient#${patId}",
				"hash": "resource:org.transfer.CCDA#${hash}",
				"requesterId": "resource:org.transfer.Clinic#${CLINIC_ID}",
				"providerId": "resource:org.transfer.Clinic#${owner_id}",
				"StartTransId": "${start_timestamp}",
				"Success": ${success_flag},
				"ErrorMessage": "${err_msg}"
			}`
		};

		// console.log("finish: ", options)
		TransactionSubmit.handler(options);
	} catch (error) {
		console.error('Error in submitting Final Transfer transaction:', error);
	}
}

async function createEMPIQuery(req, res) {
	const { con } = await mysql_connect();

	let query = req.query;

	console.log("Recieved Query params: ", query);
	let number_of_fields = Object.keys(query).length
	let patient_info_empty = false;

	let sql = "SELECT * FROM `EMPI` WHERE ";
	let i = 1;
	for (const key in query) {
		if (key != 'DocId' && key != 'DocName') {
			if (query[key]) {
				if (i != 1) {
					sql += "AND "
				}
				// security: Is this SQL injection resistant?
				sql += `${key} LIKE '${query[key]}' `;			// Like used for case-insensitivity
				i++;
			}
			else {
				number_of_fields--;
				// console.log(number_of_fields);
	
				if (number_of_fields === 0) {
					patient_info_empty = true;
				}
			}
		}
	}
	if (patient_info_empty) {
		console.log("Empty query from Clinic");
		res.send("Your query is empty. Please try again with a valid query");
	}
	else {
		sql += ";";
		// wrap the query in try catch if it throws any errors
		let [rows, fields] = await con.execute(sql);	
		// let rows = [{Id: 'AH19'},];

		// error handling
		if (rows.length === 1) {
			const pat_id_from_EMPI = rows[0].Id;
			console.log(ls.success,"Patient id found");
			return pat_id_from_EMPI;
		} else if (rows.length === 0) {
			res.status(422).send("No patient found, enter valid data");		// 422: Unprocessable entity. The task of returning a file is unprocessable.
		} else if (rows.length > 1) {
			res.status(422).send("Many patients found, enter more fields");
		}
	}
}

async function getLatestCCDA(pat_id) {
	const { bizNetworkConnection, businessNetworkDefinition } = await connect();

	let query = bizNetworkConnection.buildQuery(`SELECT org.transfer.CCDA WHERE (patId=="resource:org.transfer.Patient#${pat_id}")`);
	
	// wrap query in try catch
	let assets = await bizNetworkConnection.query(query);

	
	if (assets.length == 0) {
		console.log(ls.error, "CCDA not found in blockchain");
		return null;
	}

	// Latest CCDA
	let max = assets[0];
	for (let i = 0; i < assets.length; i++) {
		if (assets[i].lastUpdate > max.lastUpdate)
			max = assets[i];
	}

	// Fetching required fields
	const asset_obj = {
		hash: max.hash,
		ownerId: max.ownerId.$identifier,	// Identifier used as Relationships are returned. Resolving queries is not possible w/o rest API.
		patId: max.patId.$identifier,	
		lastUpdate: max.lastUpdate,
	};
	console.log(ls.success, "Latest CCDA found: ");
	console.log(asset_obj);

	return asset_obj;
}


async function handleUploadCCDA(req, res) {
	req.pipe(req.busboy);
	req.busboy.on('file', async function handleBusboyFile(fieldname, file, file_name){
		complete_path = path.join(__dirname, ccda_store_path, file_name);
		fstream = fs.createWriteStream(complete_path);
		file.pipe(fstream);
		fstream.on('close', async function () {
			console.log("Upload Finished of: " + file_name);
			res_obj.status = `File: ${file_name}, was successfully stored`;
			let block_data = await preprocess(file_name, ccda_store_path);
			// console.log(block_data);
			const hashed_file_name = path.join(__dirname, ccda_store_path, block_data.hash + '.xml');
			fs.rename(complete_path, hashed_file_name, async function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log(`File successfully renamed`);
				}

				await addCCDA(block_data);

				res.send(block_data);
			});
		});
	});			
}


async function addCCDA(block_data) {
	const { bizNetworkConnection, businessNetworkDefinition } = await connect();

	try {
		let hash = block_data.hash;
		let patId = block_data.pat_id;
		let clinicId = block_data.clinic_id;
		let factory = businessNetworkDefinition.getFactory();

		let CCDA_Registry = await bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');
		
		// if asset exists, delete it			////// Just for the demo, don't deploy to production
		let assetExists = await CCDA_Registry.exists(hash);
		if (assetExists) {
			console.log("Asset already exists, removing it");
			await CCDA_Registry.remove(hash);
		}

		let newCCDA = factory.newResource('org.transfer', 'CCDA', hash);
		newCCDA.patId = factory.newRelationship('org.transfer', 'Patient', patId);
		newCCDA.ownerId = factory.newRelationship('org.transfer', 'Clinic', clinicId);
		newCCDA.lastUpdate = new Date();
		await CCDA_Registry.add(newCCDA);
		console.log("CCDA asset successfully added to the blockchain");

		return block_data;
		
	} catch (error) {
		console.error('uh-oh: ', error);
	}
}

async function preprocess(file_name, dir) {
	/**TODO
	 1. Make xmlparsing and hash computing parallel using promises.all 
	 2. Use object destructuring
	 */
	let block_data = {};
	block_data.hash = await computeFileHash(file_name, dir);
	
	let xml_data = await getXmlData(file_name, dir);
	block_data.clinic_id = xml_data.clinic_id;
	block_data.pat_id = xml_data.pat_id;
	
	return block_data;
}

function getXmlData(file, dir) {
	return new Promise((resolve, reject) => {
		const parser = require('xml2json');
		fs.readFile(path.join(dir, `${file}`), function (err, data) {
			if (err) {
				console.log("Error! "+ err);
				reject(err);
			} else {
				const options = {
					object: true,
				}

				console.log("Data read from the CCDA is:");

				const json = parser.toJson(data, options);
				const patInfo = json.ClinicalDocument.recordTarget.patientRole;
				console.log("Given Name: " + patInfo.patient.name.given);
				console.log("Family Name: " + patInfo.patient.name.family);
				console.log("Patient Id: " + patInfo.id.root);
				console.log("Clinic Name: " + patInfo.providerOrganization.name);
				console.log("Clinic Id: " + patInfo.providerOrganization.id.root);

				const ret_obj = {
					clinic_id: patInfo.providerOrganization.id.root,
					pat_id: patInfo.id.root,
				}

				resolve(ret_obj);
			}
		});
	});
}

async function computeFileHash(file, dir) {
	const crypto = require('crypto');
	const Q = require('q');

	const deferred = Q.defer();
	const file_path = path.join(__dirname, dir, file);
	let fd = fs.createReadStream(file_path);
	let hash = crypto.createHash('sha256');
	hash.setEncoding('hex');
	console.log(`Computing hash of the CCDA`);
	fd.on('end', () => {
		hash.end();
		const computed_hash = hash.read()
		console.log('Hash of file is.. ');
		console.log(computed_hash);
		deferred.resolve(computed_hash);
	});

	fd.pipe(hash);			// imp

	return deferred.promise;
}
app.post('/api/documents', handleUploadCCDA);

async function AddAssetaudit(req,res){
	const { bizNetworkConnection, businessNetworkDefinition } = await connect();
	// let historian = await bizNetworkConnection.getHistorian();
	// let historianRecords = await historian.getAll();

    
	/*
	Querying all StartTransfer transactions
	*/
	// let hname = "CHO";
 //    let q1 = bizNetworkConnection.buildQuery(`SELECT org.transfer.StartTransfer WHERE (requesterId=='resource:org.transfer.Clinic#SHO')`);   

 // 	let ST = await bizNetworkConnection.query(q1);
 //    // console.log(ST);
 //    console.log("Hash of CCDA that was requested:"+ST[0].hash.$identifier);
 //    console.log("Requesting Hospital:"+ST[0].requesterId.$identifier);
 //    console.log("Providing Hospital:"+ST[0].providerId.$identifier);

    /*
		Do same for FinishTransfer
    */

    
    /*
	Querying all the AddAsset Trasactions
    */
    let q2 = bizNetworkConnection.buildQuery('SELECT org.hyperledger.composer.system.AddAsset');   

 	let AA = await bizNetworkConnection.query(q2);
 	console.log(AA.length);
 	for(i=0;i<AA.length;i++){
 		console.log(`*************RECORD ${i}*************`);
	    console.log("Hash:"+AA[i].resources[0].hash);
	    console.log("Owner:"+AA[i].resources[0].ownerId.$identifier);
	    console.log("Patient:"+AA[i].resources[0].patId.$identifier);
	    console.log(`-------------------------------------`);
 	}
   
    // let q3 = bizNetworkConnection.buildQuery(`SELECT org.transfer.StartTransfer WHERE (patId=="resource:org.transfer.Patient#${pat_id}")`);   


    console.log(typeof AA);
    res.send(AA);
}
app.get('/AddAsset',AddAssetaudit);

async function PatientCCDAAudit(req,res){
	
	let pat_id = await createEMPIQuery(req, res);
	const { bizNetworkConnection, businessNetworkDefinition } = await connect();

	let query = bizNetworkConnection.buildQuery(`SELECT org.transfer.CCDA WHERE (patId=="resource:org.transfer.Patient#${pat_id}")`);
	
	// wrap query in try catch
	let assets = await bizNetworkConnection.query(query);

	
	if (assets.length == 0) {
		console.log(ls.error, "CCDA not found in blockchain");
		return null;
	}

		res.send(assets);
}
app.get('/PatientCCDAAudit',PatientCCDAAudit);

// Creation of EMPI



// app.listen(port, () => console.log(`Listening on port ${port}...`));
const http = require('http');
const server = http.createServer(app);
server.listen(port, HIE_IP, () => console.log(`${CLINIC_ID} is listening on ${HIE_IP}:${port} ...`));