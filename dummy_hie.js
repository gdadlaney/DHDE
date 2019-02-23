const express = require('express');
const app = express();
const mysql = require('mysql');
// const Sequelize = require('sequelize');
const path = require('path');				// easy way to handle file paths
const fs = require('fs');

const dir_path = './ccda_store';			// name of directory to store the files in	////// rename ccda_store
const {
	HIE_IP,
	port,
	CLINIC_ID,
	sql_user, 
	sql_pass, 
	sql_db,
} = require('./config');		//environment variables
const request = require('request');
const {connect} = require('./connect');	



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
		//console.log(typeof hash)
		console.log("before submission");
		TransactionSubmit.handler(options);
		console.log("after submission");
	} catch (error) {
		console.log('uh-oh', error);
	}
}



async function getAsset(pat_id) {		// hash
	const {bizNetworkConnection,businessNetworkDefinition} = await connect();

	// console.log("****", pat_id);
	let query = bizNetworkConnection.buildQuery(`SELECT org.transfer.CCDA WHERE (patId=="resource:org.transfer.Patient#${pat_id}")`);
	let assets = await bizNetworkConnection.query(query);
	let max = assets[0];
	for(let i=0;i<assets.length;i++) {
		if(assets[i].lastUpdate>max.lastUpdate)
		max = assets[i];
	}
	// console.log(max);
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
		console.log('uh-oh', error);
		// this.log.error(METHOD, 'uh-oh', error);
	}

	return true;	/////////
}
async function requestCCDAtransfer(asset_obj)		//hash
{
	const dir_path = './ccda_store';
	const base_url = `http://127.0.0.2:${port}`;						///////globals
	// const dir_path = './ccda_store/ccda_cache';	//////////////

	// looked up from EMPI
	// const target_id = '123';		// id of file is its hash

	console.log(`target_id: ${asset_obj.ownerId}`);

	// old Arch
	// lookup asset, get the owner of CCDA (identified by mrn)
	// let target_hie = await getClinicId(target_id);
	
	const target_id = asset_obj.hash;
	const target_hie = asset_obj.ownerId;

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
						fs.writeFile(abs_path, body, function(err, data) {	
							if (err)
								console.log(err);
							else {
								console.log("Recieved requested CCDA");
								// console.log(body);
		
								// hash check
								console.log(`Requested hash: ${target_id}`);
								computeFileHash(target_id+'.xml', dir_path)
								.then( (received_file_hash) => {
									console.log(`Recieved file hash: ${received_file_hash}`);
									if ( target_id !== received_file_hash ) {
										console.log("** Hashes of files do no match");
										throw "Hashes of files do no match";
									} else {
										console.log('Hash verified');

										// submit Final transaction
										submitFinishTransferTransaction()
										.then (
											resolve(abs_path)
										);
									}
								});
							}
						});
					}
				}
			});
		});

	}
	
	console.log("****", get_url);
	const file_name = await asyncGet(get_url);
	console.log("*** async returned filename: "+file_name);

	return file_name;
}

// check for security
// app.get('/static?', (req, res) => {
// 	console.log(req.query['name']);
// });

app.use('/static', express.static('static'));

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
				
				// old todo - send pat_id to record_chain and get back mrn
				const pat_id_found = result[0].Id;			/////////

				/// getObjectFromBlockhain
				getAsset(pat_id_found)
				.then( (asset_obj) => {
					// check for file in folder and send it back.
					const hash_found = asset_obj.hash;

					const hash_path = path.join(__dirname, dir_path, hash_found+".xml");
					try {
						fs.statSync(hash_path);		// using statSync instead of readdirSync, as we just need to check if file is present.
						res.sendFile(hash_path);		// convenient method
						console.log(`File: ${hash_found+".xml"} found & send back successfully from ccda_cache`);
					}
					catch (err) {
						// console.log('* Error in file lookup');
						if (err.code === 'ENOENT') {
							// check in the blockchain
							requestCCDAtransfer(asset_obj)
							.then( (file_path) => {						/////// this won't work
								if (file_path != null) {
									// res.json({Status: `File: ${hash_found+".xml"} was found `});
									res.sendFile(file_path);		// convenient method
									console.log(`File: ${hash_found+".xml"} received & send back successfully from blockchain`);
								}
								else
									res.status(404).send(`File: ${hash_found+".xml"} does not exist in CCDA Store or on the blockchain`);		// 404 : Not FOund
							});
						} else
							res.status(400).send(err);			// 400: Bad Request
					}
				})
				.catch( (err) => console.log("Some err in blockchain query: ", err) );

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
	let res_obj = { status: 'file upload failed'};					// initialization
	// let metadata = { pat_id:-1, ehr_id:-1, doc_id:-1, mrn:-1 };
	// let flags = {
	// 	file_received: false,
	// 	file_stored: false,
	// 	valid_metadata:false,
	// 	data_sent: false,
	// };

	// collect file
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		// flags.file_received = true;

		complete_path = path.join(__dirname, dir_path, filename);
		fstream = fs.createWriteStream(complete_path);
		file.pipe(fstream);
		fstream.on('close', () => {
			console.log("Upload Finished of: " + filename);

			res_obj.status = `file: ${filename}, was successfully stored`;
			
			// create block object - can promise be used here?
			console.log(filename);
			preprocess(metadata, dir_path, filename)				/////////// async
			.then( (block_data) => {
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
						console.log("File succesfully stored & logged on the blockchain");
					})
					.catch( (err) => console.log(err) );
			});
			

			});
		});

	});

	
});

async function AddCCDA(block_data)
{
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
		}
		// doesn't work when Asset does not exist.

		let newCCDA = factory.newResource('org.transfer', 'CCDA', hash);
		newCCDA.patId = factory.newRelationship('org.transfer', 'Patient', patId);
		newCCDA.ownerId = factory.newRelationship('org.transfer', 'Clinic', clinicId);
		newCCDA.lastUpdate = new Date();
		await CCDA_Registry.add(newCCDA);

		return block_data;
	} catch (error) {
		console.log('* uh-oh', error);
		// this.log.error(METHOD, 'uh-oh', error);
	}
}

app.get(`/${CLINIC_ID}/api/documents/?`, (req, res) => {

	// check transaction (identified by hash)

	// req.query is a dict with all query params
	const requested_hash = req.query['hash'];
	const hash_path = path.join(__dirname, dir_path, requested_hash+".xml");
	//Verify requester using historian : Ani assiged
	let hash_found = requested_hash;	// change this

	
	try {
		fs.statSync(hash_path);		// using statSync instead of readdirSync, as we just need to check if file is present.
	// Compute the hash of the file at hash_path. Compare it with the historian hash(starttransferTransaction)
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
		// Fetching form data from get request
		// code copied, refactor into functions
		let url = `http://${HIE_IP}:${port}/api/documents`;
		const dir_path = './ehr_dir/mrn_cache'			// name of directory to store the files in 
		let get_url = url+'?';
		const requested_mrn= '123';				/////////

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
					console.log(`${resp.statusCode}: ${err}`);
					res.send(`${resp.statusCode}: ${err}`);
				}
				else {
					fs.writeFile(path.join(__dirname, dir_path, requested_mrn+'.xml'), body, function(err, data) {
						if (err) {
							console.log(err);
							res.send(err);
						} else {
							console.log("Successfully recieved requested data");
							// console.log(body);
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
// server.listen(port, '0.0.0.0', () => console.log(`${CLINIC_ID} is listening on ${HIE_IP}:${port} ...`));

// Helper Methods
function sendDataNoMetadata(res, res_obj) {
	console.log("Response sent.");
	res.json(res_obj);
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

async function preprocess(metadata, dir_path, file_name) {
	// let d = new Date();
	const parser = require('xml2json');
	
	let block_data = {
		// mrn: metadata.mrn,
		// ehr_id: metadata.ehr_id,
		// doc_id: metadata.doc_id,
	};
	// block_data.pat_id = metadata.ehr_id+""+metadata.pat_id;
	// block_data.timestamp = d;
	block_data.hash = await computeFileHash(file_name, dir_path);

	// const asyncFileHash = (file_name, dir_path) => {
	// 	return new Promise((resolve, reject) => {
	// 		computeFileHash(file_name, dir_path)
	// 		.then( (hash) => {
	// 			// block_data.hash = hash;
	// 			console.log("In then...", hash);
	// 			resolve(hash);
	// 		});
	// 	});
	// }

	// block_data.hash = await asyncFileHash(file_name, dir_path);
	// console.log("After computeFileHash, block_data is: ", block_data);

	// path.join(dir_path, `/ccda_store/${file_name}`)
	const asyncGetXmlData = () => {
		return new Promise((resolve, reject) => {
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

	const ret_obj = await asyncGetXmlData();
	block_data.clinic_id = ret_obj.clinic_id;
	block_data.pat_id = ret_obj.pat_id;

	return block_data;		// synchronously calculated data
}

// function computeFileHash(file_name, dir_path) {
// 	const Crypto = require('crypto-js');

// 	// const hash = Crypto.SHA256(fs.readFileSync(path.join(dir_path, file_name)).toString());
// 	const hash = "b9829caed3df8290976a6102a3664f3659934ce7b4ec03e4d39328700b6df36c";
// 	console.log("Computed hash is: ", hash);

// 	return hash;
// }

async function computeFileHash(file_name, dir_path) {
	const crypto = require('crypto');
	const Q = require('q');

	const deferred = Q.defer();

	// the file you want to get the hash   
	const file_path = path.join(__dirname, dir_path, file_name);
	let fd = fs.createReadStream(file_path);
	let hash = crypto.createHash('sha256');
	hash.setEncoding('hex');
	console.log(`Computing hash of ${file_path}`);

	// const asyncGetHash = () => {
	// 	return new Promise((resolve, reject) => {
	// 		fd.on('end', function() {
	// 			hash.end();
	// 			const computed_hash = hash.read();
	// 			// block_data.hash = computed_hash
	// 			console.log(`Hash of file is: ${computed_hash}`);
				
	// 			resolve(computed_hash);
	// 		});
	// 	});
	// }
	// console.log("*****", '0000000000');
	// const computed_hash = await asyncGetHash();
	// // const computed_hash = '26eded583f2d20275cf355707ef371282be76959d6a85a6e4e23ed2f72f4cbc1';
	// console.log("*****", computed_hash);
	// // read all file and pipe it (write it) to the hash object
	// fd.pipe(hash);
	
	// return computed_hash;

	fd.on('end', function() {
		hash.end();
		const computed_hash = hash.read()
		console.log('Hash of file is.. ', computed_hash); 
        deferred.resolve(computed_hash);
	});

	fd.pipe(hash);			// imp

	return deferred.promise;
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
