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
const dir_path = './ccda_store';			// remove
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
	console.log(ls.info,"Fetching patient_id from EMPI");
	let pat_id = await createEMPIQuery(req, res);
	console.log(ls.info,"Patient id is :"+pat_id);

	console.log(ls.info,"Fetching the latest CCDA of "+pat_id+" from the blockchain");
	let latest_CCDA_obj = await getLatestCCDA(pat_id);						// try-catch may be better 
	if (latest_CCDA_obj === null) {
		res.status(404).send("No records found on the blockchain for the given patient");
		return;
	}

	// 2. Get the CCDA
	console.log(ls.info,"Checking if CCDA exists locally");
	let abs_file_path = await searchInLocal(latest_CCDA_obj);
	if (abs_file_path[1] == 409)
		res.status(409).send("Hash Check Failed");
	else{
		if (abs_file_path[0] === null) {
			console.log(ls.info,"CCDA not found locally. CCDA needs to be requested from other clinic"); 					// file not found
			abs_file_path[0] = await requestCCDATransfer(latest_CCDA_obj);
		}
	
		if (abs_file_path[0] === null) 
			console.log(ls.error,"requestCCDATransfer() failed in some uncertain way!!! ");		// this should never fire - put in catch
		else
			await submitLocalAccessTransaction(latest_CCDA_obj.hash, CLINIC_ID, docId = "JS", docName = "Jack Sparrow");
	
		res.sendFile(abs_file_path[0]);				// handle callback
	}
}

async function searchInLocal(latest_CCDA_obj) {
	const file = latest_CCDA_obj.hash+".xml";

	// searchInStore
	console.log("Checking if CCDA exists in CCDA_store");
	let abs_file_path = searchInDir(file, ccda_store_path);
	let statusCode = 200;
	
	if (abs_file_path === null) {
		console.log("CCDA not found in CCDA_Store");

		// searchInCache
		
		console.log("Checking if CCDA exists in CCDA_cache");
		abs_file_path = searchInDir(file, ccda_cache_path);
		
		if (abs_file_path === null) 
			console.log("CCDA not found in CCDA_Cache");
		else if (latest_CCDA_obj.hash != await computeFileHash(file, ccda_cache_path)) {
			console.log("Hash Check Failed");
			statusCode = 409;
		}
	}
	else if (latest_CCDA_obj.hash != await computeFileHash(file, ccda_store_path)) {
		console.log("Hash Check Failed");
		statusCode = 409;
	}
	else
		console.log("Hash Verified");

	return [abs_file_path, statusCode];
}

function searchInDir(file, dir) {
	// console.log("** searchInDir");
	let search_path = path.join(__dirname, dir, file);
	try {
		fs.statSync(search_path);			// make async & wrap in Promises?
		return search_path;
	} catch (err) {
		// console.log(err);
		if (err.code === 'ENOENT') {		// file not found
			return null;			
		}
	}
}

async function requestCCDATransfer(latest_CCDA_obj) {

	console.log(ls.info,`Id of target_clinic: ${latest_CCDA_obj.ownerId}`);
	
	let target_hash = latest_CCDA_obj.hash;
	let target_clinic = latest_CCDA_obj.ownerId;

	console.log(`Requesting: ${latest_CCDA_obj.ownerId} for CCDA transfer`);
	await submitStartTransferTransaction(target_hash, target_clinic);
	console.log(ls.success,"Request logged on the blockchain");

	console.log("")
	let abs_path = await getFile(target_hash, target_clinic);

	await submitFinishTransferTransaction();
	return abs_path;
}

async function getFile(target_hash, target_clinic) {
	/**
	 * TODO - DNS	// only needed if more than 2 hies are in the network
	 * Create a mapping of target_clinic and ip
	 * This will be used to construct base_url
	 * For now assume that the IP of target clinic is 127.0.0.1
	 */

	const base_url = `http://127.0.0.1:${port}`;

	const url = base_url + `/${target_clinic}/api/documents/`;
	const get_url = url + `?hash=${target_hash}`;				// use route params instead of query params

	return new Promise((resolve, reject) => {
		request.get(get_url, function(err, resp, body) {
			if (err) {
				console.log(ls.error,`Error: ${err}`);
				reject(err);
			}
			else {
				if (resp.statusCode == 404 || resp.statusCode == 400 || resp.statusCode == 409)
					console.log(body);
				else {
					const abs_path = path.join(__dirname, ccda_cache_path, target_hash+'.xml');
					fs.writeFile(abs_path, body, function(err, data) {	// we shouldn't change the name of the file if the mrn isn't unique
						if (err)
							console.log(err);
						else {
							console.log(ls.success,"Recieved requested CCDA");
							// console.log(`Requested hash: ${target_hash}`);
							console.log(ls.info,"Computing hash of received file to check integrity");
							computeFileHash(target_hash+'.xml', ccda_cache_path)
							.then( (received_file_hash) => {
								// console.log(`Recieved file hash: ${received_file_hash}`);
								if ( target_hash !== received_file_hash ) {
									console.log(ls.error,"Hashes of files do no match");
									//delete the file
									throw "Corrupt file.";
								} else {
									console.log('Hash verified.');
									console.log(ls.success,'File intergrity check complete.');
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
	const hash_path = path.join(__dirname, dir_path, requested_hash+".xml");

	try {
		fs.statSync(hash_path);		// using statSync instead of readdirSync, as we just need to check if file is present.
		
		let hash_found = await computeFileHash(`${requested_hash}.xml`, dir_path);
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
		console.log('* Error in file lookup');
		if (err.code === 'ENOENT')
			res.status(404).send(`File: ${hash_found+".xml"} does not exist in CCDA Store`);		// 404 : Not FOund
		else
			res.status(400).send(err);			// 400: Bad Request
	}
};

async function submitLocalAccessTransaction(hash, requesterId, docId, docName) {
try {
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		
		let options = {
			card: 'admin@ccda-transfer',
			data: `{
				"$class": "org.transfer.LocalAccess",
				"hash": "resource:org.transfer.CCDA#${hash}",
				"requesterId": "resource:org.transfer.Clinic#${requesterId}",
				"docId": "${docId}",
				"docName": "${docName}"
			}`
		};
		TransactionSubmit.handler(options);
	} catch (error) {
		console.log('Error in submitting Local Access transaction:', error);
	}
}

async function submitStartTransferTransaction(hash, owner_id) {
	try {
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		
		let options = {
			card: 'admin@ccda-transfer',
			data: `{
				"$class": "org.transfer.StartTransfer",
				"hash": "resource:org.transfer.CCDA#${hash}",
				"requesterId": "resource:org.transfer.Clinic#${CLINIC_ID}",
				"providerId": "resource:org.transfer.Clinic#${owner_id}"
			}`
		};
		TransactionSubmit.handler(options);
	} catch (error) {
		console.log('Error in submitting Final Transfer transaction:', error);
	}
}

async function submitFinishTransferTransaction() {
	try {
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		
		let options = {
			card: 'admin@ccda-transfer',
			data: `{
				"$class": "org.transfer.FinishTransfer" 
			}`
		};
		TransactionSubmit.handler(options);
	} catch (error) {
		console.log('Error in submitting Final Transfer transaction:', error);
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
		ownerId: max.ownerId.$identifier,
		patId: max.patId.$identifier,			// Identifier used as Relationships are returned. Resolving queries is not possible w/o rest API.
		lastUpdate: max.lastUpdate,
	};
	console.log(ls.success,"Latest CCDA found: ");
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

		console.log("Adding CCDA asset to the blockchain");
		let assetExists = await CCDA_Registry.exists(hash);
		if (assetExists) {
			console.log("Asset already exists, removing it");
			await CCDA_Registry.remove(hash);
			console.log("Asset removed");
			console.log("Adding new CCDA asset");

		}
		// doesn't work when Asset does not exist.
		let newCCDA = factory.newResource('org.transfer', 'CCDA', hash);
		newCCDA.patId = factory.newRelationship('org.transfer', 'Patient', patId);
		newCCDA.ownerId = factory.newRelationship('org.transfer', 'Clinic', clinicId);
		newCCDA.lastUpdate = new Date();
		await CCDA_Registry.add(newCCDA);
		console.log("CCDA asset successfully added to the blockchain");

		// console.log("Block Data " + block_data);
		// console.log("Hash of the file " + hash);
		return block_data;
		
	} catch (error) {
		console.log('* uh-oh', error);
		// this.log.error(METHOD, 'uh-oh', error);
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

// Creation of EMPI



// app.listen(port, () => console.log(`Listening on port ${port}...`));
const http = require('http');
const server = http.createServer(app);
server.listen(port, HIE_IP, () => console.log(`${CLINIC_ID} is listening on ${HIE_IP}:${port} ...`));