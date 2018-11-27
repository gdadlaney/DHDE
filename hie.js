const express = require('express');
const app = express();

const dir_path = './hie_dir'			// name of directory to store the files in 

app.get('/', (req, res) => {
	res.send("Send a GET or POST request to '/api/documents'")
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

// step 1: Accepting file, sent via POST request
// init for accepting post request
const busboy = require('connect-busboy');	// middleware for form/file upload
const path = require('path');				// easy way to handle file paths
const fs = require('fs');
app.use(busboy());

app.post('/api/documents', (req, res) => {
	// todo - check if res.body contains a valid xml file

	let complete_path;
	let fstream;
	// let res_obj = { status: 'file upload failed', data: '' };			// initialization
	let res_obj = { status: 'file upload failed', data: '' };
	let metadata = { pat_id:-1, ehr_id:-1, doc_id:-1, mrn:-1 };
	// let metadata2 = [];
	let flags = {};
	flags.executionComplete = false;
	flags.dataSent = false;

	req.on('form', () => {
		console.log("hi");	
	});
	
	// collect file
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		complete_path = path.join(__dirname, dir_path, filename);
		console.log(`Uploading: ${filename} to ${complete_path}`);

		fstream = fs.createWriteStream(complete_path);
		file.pipe(fstream);
		fstream.on('close', () => {    
			console.log("Upload Finished of: " + filename); 
			
			res_obj.status = `file: ${filename}, was successfully stored`;
			res_obj.data = readFileSync(complete_path);
			
			flags.executionComplete = true;
			// flags = sendData(res, res_obj, flags);
			console.log(res_obj);
			if ( flags.executionComplete === true && flags.dataSent === false ) {
				res.json(res_obj);
				flags.dataSent = true;
			}
		});
	});

	// collect metadata - {pat_id, ehr_id, doc_id, mrn}
	req.busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
		// todo - count for only one of each of the metadata fields, validate length and type for each(using joi)
		console.log('Field [' + fieldname + ']: value: ' + val + " " + require('util').inspect(val));
		metadata[fieldname] = val;
		// metadata2.push({name:fieldname, value:val});
	});

	// send response
	req.busboy.on('finish', function() {
		// todo - if (res_obj.status == 'file upload failed'), return a failed http status code.
		// todo - if any of the fields in metadata == -1, return a failed http status code.

		// todo - since there is an async call fstream.on('close'), we need to wait for it.
		// wait for file write to finish	// need a more elegant solution
		// Din't work - sleeps forever, since node is single-threaded, once an event occurs, it has to execute it completely before moving on to the next event.
		// const sleep = require('sleep');
		// while (true) {
		// 	if ( executionComplete === true )
		// 		break;
		// 	else
		// 		sleep.sleep(1);
		// }
		// Didn't work -
		// const interval = 400; 		// ms
		// let timer = setInterval(() => {
		// 	if ( executionComplete === true )
		// 		clearInterval(timer);
		// }, interval);

		console.log("finish called!!!");
		res_obj.metadata = metadata;

		flags = sendData(res, res_obj, flags);			// need a better solution
		// also have not handled the case where file uplad is finished before .on('finished') is called
	} );
});

app.listen(3000, () => console.log('Listening on port 3000...'));

// Helper Methods
function sendData(res, res_obj, flags) {
	if ( flags.executionComplete === true && flags.dataSent === false ) {
		res.json(res_obj);
		flags.dataSent = true;
	}
	return flags;
}

function listFiles(dir, res) {
	fs.readdir(dir, (err, files) => {
		if (err) {
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

// Fails, // wanted to return html_lines form readFile() once file was closed, 
// but this fails, an empty string(initialization) is returned.
// function readFile(path) {
// 	let html_lines = '';
// 	let flag = false;
// 	console.log("function called");
// 	const lineReader = require('readline').createInterface({
// 		input: fs.createReadStream(path)
// 	});
// 	lineReader.on('line', (line) => {
// 		html_lines += line+'\n';
// 	});
// 	lineReader.on('close', () => {
// 		console.log(html_lines);
//		// return html_lines;
// 		flag = true;
// 	});

// 	while (!flag)
// 		setTimeout((a=1)=>{console.log(a++);}, 2000);

// 	return html_lines;
// }
