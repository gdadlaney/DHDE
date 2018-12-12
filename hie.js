const express = require('express');
const app = express();

const dir_path = './hie_dir';			// name of directory to store the files in 

app.get('/', (req, res) => {
	res.send("Send a GET or POST request to '/api/documents'");
});

// Show contents of directory - for debugging
app.get('/api/documents', (req, res) => {
	const fs = require('fs');
	// todo - if no exception caught
	listFiles(dir_path, res);
	// res.send(listFiles(dir_path));		// not possible - timing issues
});

// step 2: send file on GET request(communication in opposite direction)
// app.get('/api/documents/:mrn', (req, res) => {
	// Lokk for the file in dir_path
// });

// step 1: Accept file(along with metadata), sent via POST request
// init for accepting post request
const busboy = require('connect-busboy');	// middleware for form/file upload(multipart/form-data)
const path = require('path');				// easy way to handle file paths
const fs = require('fs');
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
		console.log(`Uploading: ${filename} to ${complete_path}`);

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
			[res_obj, flags, err_msg] = assignMetadata(res_obj, metadata, flags);
			// res.json(res_obj);
			flags = sendData(res, res_obj, flags, err_msg);
			if ( flags.data_sent ) console.log("Data was sent from the 'file write callback'");

			// renaming file: can be done after sending back the response, since it doesn't affect what we send back in the response
			// todo - rename file with the mrn in metadata using fs.rename()
		});
	});

	// collect metadata - {pat_id, ehr_id, doc_id, mrn}
	req.busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
		console.log('Field [' + fieldname + ']: value: ' + require('util').inspect(val));
		metadata[fieldname] = val;
		// metadata2.push({name:fieldname, value:val});
	});

	req.busboy.on('finish', function() {
		console.log("finish called!!!");
		if ( flags.data_sent )	return;
		if ( !flags.file_received ) {
			res.status(400).send("File not received");			// 400: Bad Request
			return;
		}

		// repeated section - whichever happens last	// need to find a better way
		[res_obj, flags, err_msg] = assignMetadata(res_obj, metadata, flags);
		// res.json(res_obj);
		flags = sendData(res, res_obj, flags, err_msg);				
		if ( flags.data_sent ) console.log("Data was sent from the 'finish event callback'");
	});
});

app.listen(3000, () => console.log('Listening on port 3000...'));

// Helper Methods
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

function listFiles(dir, res) {
	fs.readdir(dir, (err, files) => {
		if ( err ) {
			console.log('Error while reading files from directory');
			// todo - throw exeception
		} else {
			// todo - logic to return on xml files
			// return files;							// return from callback not possible!
			res.send(files);
		}
	});
}

// reads complete file in memory - can be a problem for huge files.
function readFileSync(path) {
	var lines = require('fs').readFileSync(filename=path, 'utf-8')
    .split('\n')
	.filter(Boolean);
	return lines.join("\n");
}