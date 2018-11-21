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
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		complete_path = path.join(__dirname, dir_path, filename);
		console.log(`Uploading: ${filename} to ${complete_path}`);

		fstream = fs.createWriteStream(complete_path);
		file.pipe(fstream);
		fstream.on('close', () => {    
			console.log("Upload Finished of: " + filename); 
			
			const res_obj = { status: `file: ${filename}, was successfully stored`, id: 1, data: readFileSync(complete_path) };
			// console.log(res_obj);
			res.json(res_obj);
		});
	});
});

app.listen(3000, () => console.log('Listening on port 3000...'));

// Helper Methods
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
