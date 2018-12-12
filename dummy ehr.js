// fetch file from folder
const fs = require('fs');
const request = require('request');

// step 1: make a POST request to hie.js using request module
const url = 'http://localhost:3000/api/documents';
var req = request.post(url, function handleResponse(err, resp, body) {
	if (err) {
		console.log(`Error: ${err}`);
	} else {
		if (resp.statusCode === 400	|| resp.statusCode === 422) {
			const err_msg = body;
			console.log(resp.statusCode + "Bad Request OR Invalid Data: ");
			console.log(err_msg);
		}
		else {
			const res_obj = JSON.parse(body)
			console.log(res_obj);
		}
	}
});

// sending sample.xml over multipart/form-data
const filepath = './ehr_dir/sample.xml';
const form = req.form();
form.append('file', fs.createReadStream(filepath));		// createReadStream() does not contain the actual data of a file, but the path. Try to run it from a different system.
form.append('pat_id', "123");
form.append('ehr_id', "001");
form.append('doc_id', "456");
form.append('mrn', "123");
// We don't need to submit the form manually.
// Items can be added until the request is fired on the next cycle of the event-loop


// todo - step 2: send a GET request for a ccda & print. Should it be stored on disk?