// fetch file from folder
const fs = require('fs');
const request = require('request');

// step 1: make a POST request to hie.js using request module
const url = 'http://localhost:3000/api/documents';
var req = request.post(url, function (err, resp, body) {
	if (err) {
		console.log(`Error: ${err}`);
	} else {
		const res_obj = JSON.parse(body)
		console.log(res_obj);
	}
});

// sending sample.xml
const filepath = './ehr_dir/sample.xml';
const form = req.form();
form.append('file', fs.createReadStream(filepath));
// docs - don't we need to submit the form or something?

// todo - step 2: send a GET request for a ccda & print. Should it be stored on disk?