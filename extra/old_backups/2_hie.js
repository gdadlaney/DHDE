const express = require('express');
const app = express();
const mysql = require('mysql');
// const Sequelize = require('sequelize');
const path = require('path');				// easy way to handle file paths
const fs = require('fs');

const dir_path = './hie_dir';			// name of directory to store the files in
const {
	HIE_IP,
	port,
	CLINIC_ID,
	sql_user, 
	sql_pass, 
	sql_db,
} = require('./config');		//environment variables

const request = require('request');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;;
let bizNetworkConnection, businessNetworkDefinition = null

async function connect() {
	if (businessNetworkDefinition == null) {
		/////////////// also submit the Purge + SetupDemo transaction along with the connection
		/////////////// needs another tansaction - SetupAsset
		const cardname = 'admin@ccda-network';
		bizNetworkConnection = new BusinessNetworkConnection();
		businessNetworkDefinition = await bizNetworkConnection.connect(cardname);
	} else console.log("Already connected");
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
		console.log(error);
		this.log.error(METHOD, 'uh-oh', error);
	}
}

async function submitFinishTransferTransaction() {
	try {
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		console.log("after fetching");
		let options = {
			card: 'admin@ccda-transfer',
			data: `{
				"$class": "org.transfer.FinishTransfer" 
			}`
		};
		//console.log(typeof hash)
		console.log("before submission");
		TransactionSubmit.handler(options);
		console.log("after submission");
	} catch (error) {
		console.log(error);
		this.log.error(METHOD, 'uh-oh', error);
	}

	return true;	/////////
}

async function getClinicId(target_id) {		// hash
	await connect();

	console.log('getClinicIdEntry');

	console.log('123');

	let CCDA_Registry = await bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');
	console.log('456');
	// try {			// doesn't work as expected
		let aResources = await CCDA_Registry.get(target_id);				////// need to handle error when Asset doesn't exist
		let hash = aResources.hash;
		let lastUpdate = aResources.lastUpdate;
		let patient = aResources.patId.$idenifier;
		let owner = aResources.ownerId.$identifier;

		console.log(`Asset Lookup: ${hash}, ${lastUpdate}, ${patient}, ${owner}`);

		return owner;
	// } catch(err) {
	// 	console.log("hi", err);
	// 	return Promise.reject(err);
	// }
}

async function requestCCDAtransfer(target_id)		//hash
{
	const dir_path = './hie_dir';
	const base_url = `http://127.0.0.2:${port}`;						///////globals
	// const dir_path = './hie_dir/ccda_cache';	//////////////

	// looked up from EMPI
	// const target_id = '123';		// id of file is its hash

	console.log(`target_id: ${target_id}`);

	// lookup asset, get the owner of CCDA (identified by mrn)
	let target_hie = await getClinicId(target_id);
	
	const url = base_url + `/${target_hie}/api/documents`;
	const get_url = url + `?hash=${target_id}`;

	// submit Start transaction
	await submitStartTransferTransaction(target_id, target_hie);

	const asyncGet = (get_url) => {
		return new Promise((resolve, reject) => {
			request.get(get_url, function(err, resp, body) {
				if (err) {
					console.log(`Error: ${err}`);
					reject(err);
				}
				else {
					if (resp.statusCode == 404 || resp.statusCode == 400)
						console.log(body);
					else {
						const abs_path = path.join(__dirname, dir_path, target_id+'.xml');
						fs.writeFile(abs_path, body, function(err, data) {	// we shouldn't change the name of the file if the mrn isn't unique
							if (err)
								console.log(err);
							else {
								console.log("Successfully recieved requested CCDA");
								console.log(body);
		
								// hash check
								console.log(`Requested hash: ${target_id}`);
								console.log(`Recieved file hash: ...`);
								console.log('Hash verified');
		
								// submit Final transaction
								submitFinishTransferTransaction()
								.then (
									resolve(abs_path)
								);
							}
						});
					}
				}
			});
		});

	}
	
	const file_name = await asyncGet(get_url);
	console.log("*** async returned filename: "+file_name);

	return file_name;
}

// send file back, given identification information
app.get('/api/documents?', (req, res) => {
	let sql = "SELECT * FROM `patients` WHERE ";
	let i = 1;
	for (const key in req.query) {
		if (req.query[key].length) {
			if (i != 1) {
				sql += "AND "
			}
			sql += `${key} LIKE '${req.query[key]}' `;			// Like used for case-insensitivity
			i++;
		}
	}

	console.log(sql);
	if (i > 1) {
		con.query(sql, function (err, result) {
			if (err) throw err;
			else if (result.length == 1) {
				console.log(result);
				
				// todo - send pat_id to record_chain and get back mrn
				const mrn_found = result[0].hash;			/////////

				// check for file in folder and send it back.
				const mrn_path = path.join(__dirname, dir_path, mrn_found+".xml");
				try {
					fs.statSync(mrn_path);		// using statSync instead of readdirSync, as we just need to check if file is present.
					res.sendFile(mrn_path);		// convenient method
					console.log(`File: ${mrn_found+".xml"} found & send back successfully`);
				}
				catch (err) {
					console.log('* Error in file lookup');
					if (err.code === 'ENOENT') {
						// check in the blockchain	////////////////////////
						requestCCDAtransfer(mrn_found)
						.then( (file_path) => {
							if (file_path != null) {
								res.sendFile(file_path);		// convenient method
								console.log(`File: ${mrn_found+".xml"} received from *Transfer* & send back successfully`);
							}
							else
								res.status(404).send(`File: ${mrn_found+".xml"} does not exist in CCDA Store or on the blockchain`);		// 404 : Not FOund
						});
					} else
						res.status(400).send(err);			// 400: Bad Request
				}
			} else if (result.length == 0)
				res.status(422).send("No patient found, enter valid data");		// 422: Unprocessable entity. The task of returning a file is unprocessable.
			else if (result.length > 1)
				res.status(422).send("Many patients found, enter more fields");
	  	});
	}
	else
		res.status(422).send("No fields entered");
});

// step 1: Accept file(along with metadata) from ehr
// init for accepting post request
const busboy = require('connect-busboy');	// middleware for form/file upload(multipart/form-data)
app.use(busboy());

app.post('/api/documents', (req, res) => {
	// todo - check if res.body contains a valid xml file

	let complete_path;
	let fstream;
	let res_obj = { status: 'file upload failed', data: '' };					// initialization
	let metadata = { pat_id:-1, ehr_id:-1, doc_id:-1, mrn:-1 };
	let flags = {
		file_received: false,
		file_stored: false,
		valid_metadata:false,
		data_sent: false,
	};

	// collect file
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		flags.file_received = true;

		complete_path = path.join(__dirname, dir_path, filename);
		fstream = fs.createWriteStream(complete_path);
		file.pipe(fstream);
		fstream.on('close', () => {
			console.log("Upload Finished of: " + filename);

			res_obj.status = `file: ${filename}, was successfully stored`;
			res_obj.data = readFileSync(complete_path);			// redundant, as a verification/ for debugging
			flags.file_stored = true;
			if ( flags.data_sent )	return;

			// todelete - Doesn't work, since the 'finish' event occurs after all the form-data parts(file & fields)
			// have completed their callback. Handlers must be defined before the event occurs.
			// req.busboy.on('finish', function() {
			// 	console.log("finish called!!!");
			// 	res_obj.metadata = metadata;
			// 	res.json(res_obj);
			// 	// flags = sendData(res, res_obj, flags);
			// });

			// repeated section - // find better way
			// [res_obj, flags, err_msg] = assignMetadata(res_obj, metadata, flags);
			// res.json(res_obj);
			// flags = sendData(res, res_obj, flags, err_msg);
			// if ( flags.data_sent ) console.log("Data was sent from the 'file write callback'");

			// renaming file: can be done after sending back the response, since it doesn't affect what we send back in the response
			/**Renaming
			 * Renames file after storing it, flags.file_stored is already set
			 * Sets the name of the file as mrn from metadata
			 */

			// create block object - can promise be used here?
			console.log(filename);
			const block_data = preprocess(metadata, dir_path, filename);				/////////// async
			console.log(block_data);

			const mrn_filename = path.join(__dirname, dir_path, block_data.hash+'.xml');
			fs.rename(complete_path, mrn_filename, (err) => {
				if (err) {
					console.log(err);
				} else {
					console.log(`File successfully renamed`);
				}
				

				AddCCDA(block_data)
				.then( (value) => {
					console.log(value);

					sendDataNoMetadata(res, res_obj);
					// console.log("Data was sent from the 'file write callback'");
					console.log("File suceesfully stored & logged on the blockchain");
				})
				.catch( (err) => console.log(err) );


			});
		});

	});

	///////////////////// metadata removed
	// collect metadata - {pat_id, ehr_id, doc_id, mrn}
	// req.busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
	// 	console.log('Field [' + fieldname + ']: value: ' + require('util').inspect(val));
	// 	metadata[fieldname] = val;
	// 	// metadata2.push({name:fieldname, value:val});
	// });

	/////////////////////// finish removed
	// req.busboy.on('finish', function() {
	// 	console.log("finish called!!!");
	// 	if ( flags.data_sent )	return;
	// 	if ( !flags.file_received ) {
	// 		res.status(400).send("File not received");			// 400: Bad Request
	// 		return;
	// 	}

	// 	// repeated section - whichever happens last	// need to find a better way
	// 	[res_obj, flags, err_msg] = assignMetadata(res_obj, metadata, flags);
	// 	// res.json(res_obj);
	// 	flags = sendData(res, res_obj, flags, err_msg);
	// 	if ( flags.data_sent ) console.log("Data was sent from the 'finish event callback'");
	// });
});

async function AddCCDA(block_data)
{
	await connect();

	try {
		await this.initFunc();
		let hash = block_data.hash;
		let patId = block_data.pat_id;
		let clinicId = block_data.clinic_id;
		let factory = this.businessNetworkDefinition.getFactory();
		
		let CCDA_Registry = await this.bizNetworkConnection.getAssetRegistry('org.transfer.CCDA');
		let newCCDA = factory.newResource('org.transfer', 'CCDA', hash);
		newCCDA.patId = factory.newRelationship('org.transfer', 'Patient', patId);
		newCCDA.ownerId = factory.newRelationship('org.transfer', 'Clinic', clinicId);
		newCCDA.lastUpdate = new Date();
		await CCDA_Registry.add(newCCDA);
	} catch (error) {
		console.log(error);
		this.log.error(METHOD, 'uh-oh', error);
	}
}

app.get(`/${CLINIC_ID}/api/documents/?`, (req, res) => {

	// check transaction (identified by hash)

	// req.query is a dict with all query params
	const requested_hash = req.query['hash'];
	const hash_path = path.join(__dirname, dir_path, requested_hash+".xml");

	let hash_found = requested_hash;	// change this

	// hash check
	
	try {
		fs.statSync(hash_path);		// using statSync instead of readdirSync, as we just need to check if file is present.
		res.sendFile(hash_path);		// convenient method
		console.log(`File: ${hash_found+".xml"} found & send back successfully`);
	}
	catch (err) {
		console.log('* Error in file lookup');
		if (err.code === 'ENOENT')
			res.status(404).send(`File: ${hash_found+".xml"} does not exist in CCDA Store`);		// 404 : Not FOund
		else
			res.status(400).send(err);			// 400: Bad Request
	}
});

app.get('/', (req, res) => {
	res.send("Send a GET or POST request to '/api/documents'");
});

app.set('view engine', 'ejs');
app.get('/requestCCDA?', (req, res) => {
	// if no query params, then show form
	if ( Object.keys(req.query).length === 0 ) {
		res.render('requestCCDA');
	} else {
		// code copied, refactor into functions
		let url = `http://${HIE_IP}:${port}/api/documents`;
		const dir_path = './ehr_dir/mrn_cache'			// name of directory to store the files in 
		let get_url = url+'?';
		const requested_mrn= '123';

		let i = 1;
		for (const key in req.query) {
			if (req.query[key].length) {
				if (i != 1) {
					get_url += "&"
				}
				get_url += `${key}=${req.query[key]}`;
				i++;
			}
		}
		console.log(get_url);

		request.get(get_url, function(err, resp, body) {
			if (err) {
				console.log(`Error: ${err}`);
				res.send(`Error: ${err}`);
			} else {
				if (resp.statusCode == 404 || resp.statusCode == 400) {
					console.log(body);
					res.send(body);
				}
				else {
					fs.writeFile(path.join(__dirname, dir_path, requested_mrn+'.xml'), body, function(err, data) {
						if (err) {
							console.log(err);
							res.send(err);
						} else {
							console.log("Successfully recieved requested data");
							console.log(body);
							res.send(body);
						}
					});
				}
			}
		});
	}
});

// Creation of EMPI
const con = mysql.createConnection({
	host: "localhost",
	user: "root",				// variable from .env does not work, why?
	password: sql_pass,
	database: sql_db,
});

con.connect(function(err) {
	if (err) throw err
	console.log("Mysql connected!");
});


// app.listen(port, () => console.log(`Listening on port ${port}...`));
const http = require('http');
const server = http.createServer(app);
server.listen(port, HIE_IP, () => console.log(`${CLINIC_ID} is listening on ${HIE_IP}:${port} ...`));

// Helper Methods
function sendDataNoMetadata(res, res_obj) {
	console.log("Response sent.");
	res.json(res_obj);
	flags.data_sent = true;
}

function sendData(res, res_obj, flags, err_msg) {
	if ( typeof sendData.err_msg_sent == 'undefined' ) sendData.err_msg_sent = false;		// static variable

	if ( !flags.valid_metadata && !sendData.err_msg_sent ) {
		res.status(400).send(err_msg);			// should only execute once					// 400: Bad Request
		sendData.err_msg_sent = true;
		flags.data_sent = true;
		console.log("* Error message sent.");
	}
	else if ( flags.file_stored === true && flags.valid_metadata === true && flags.data_sent === false ) {
		console.log("Response sent.");
		res.json(res_obj);
		flags.data_sent = true;
	}
	return flags;
}

function preprocess(metadata, dir_path, file_name) {
	// let d = new Date();
	let block_data = {
		// mrn: metadata.mrn,
		// ehr_id: metadata.ehr_id,
		// doc_id: metadata.doc_id,
	};
	// block_data.pat_id = metadata.ehr_id+""+metadata.pat_id;
	// block_data.timestamp = d;
	block_data.hash = computeFileHash(file_name, dir_path);
	const parser = require('xml2json');

	// path.join(dir_path, `/hie_dir/${file_name}`)
	fs.readFile( path.join(dir_path, `/hie_dir/${file_name}`), function(err, data) {
		const options = {
			object: true,
		}
		
		const json = parser.toJson(data,options);
		// console.log("to json ->", json);
		const patInfo = json.ClinicalDocument.recordTarget.patientRole;
		console.log("Given Name: "+patInfo.patient.name.given);
		console.log("Family Name: "+json.ClinicalDocument.recordTarget.patientRole.patient.name.family);
		console.log("Patient Id: "+json.ClinicalDocument.recordTarget.patientRole.id.root);
		console.log("Clinic Name: "+json.ClinicalDocument.recordTarget.patientRole.providerOrganization.name);
		console.log("Clinic Id: "+json.ClinicalDocument.recordTarget.patientRole.providerOrganization.id.root);

		block_data.clinic_id = patInfo.providerOrganization.id.root;
		block_data.pat_id = patInfo.id.root;
	});

	return block_data;		// synchronously calculated data
}

function computeFileHash(file_name, dir_path) {
	let fs = require('fs');
	let crypto = require('crypto');
	// the file you want to get the hash   
	let file_path = path.join(__dirname, dir_path, file_name);
	let fd = fs.createReadStream(file_path);
	let hash = crypto.createHash('sha256');
	hash.setEncoding('hex');
	console.log(`Computing hash of ${file_path}`);

	const asyncGetHash = () => {
		return new Promise((resolve, reject) => {
			fd.on('end', function() {
				hash.end();
				const computed_hash = hash.read();
				// block_data.hash = computed_hash
				console.log(`Hash of file is: ${computed_hash}`);
				
				resolve(computed_hash);
			});
		});
	}
	

	asyncGetHash()
	.then ( (hash) => {
		block_data.hash = hash;
		console.log("*****", block_data);
		// read all file and pipe it (write it) to the hash object
		fd.pipe(hash);
	} )
	
}

function assignMetadata(res_obj, metadata, flags) {		// assigns metadata if not already assigned
	let valid_flag, err_msg;

	[valid_now, err_msg] = isMetadataValid(metadata);
	if ( !flags.valid_metadata && valid_now ) {
		res_obj.metadata = metadata;
		flags.valid_metadata = true;
		return [res_obj, flags, err_msg];
		console.log("metadata assigned");
	}
	return [res_obj, flags, err_msg];
}

function isMetadataValid(metadata) {
	// refering - metadata = { pat_id:-1, ehr_id:-1, doc_id:-1, mrn:-1 };

	Joi = require('joi');
	const schema = {
		pat_id: Joi.string().required().regex(/^\d+$/).min(3).max(10),
		ehr_id: Joi.string().required().regex(/^\d+$/).min(3).max(10),
		doc_id: Joi.string().required().regex(/^\d+$/).min(3).max(10),
		mrn: Joi.string().required().regex(/^\d+$/).min(3).max(10),
	};
	const result = Joi.validate(metadata, schema);
	if ( result.error ) {
		console.log("** Invalid Metadata:", result.error.details[0].message);
		return [false, result.error.details[0].message];
	}

	return [true];
}

// reads complete file in memory - can be a problem for huge files.
function readFileSync(path) {
	let lines = require('fs').readFileSync(filename=path, 'utf-8')
	.split('\n')
	.filter(Boolean);
	return lines.join("\n");
}

// Using Sequelize ORM: Testing Mysql connection
// const sequelize = new Sequelize('dummy_data', 'root', '', {
// 	host: 'localhost',
// 	dialect: 'mysql'
// });

// sequelize.authenticate()
// 	.then(() => {
//     	console.log('Connection has been established successfully.');
// 	})
//   	.catch(err => {
//     	console.error('Unable to connect to the database:', err);
//   	});
