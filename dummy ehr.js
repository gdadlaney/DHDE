// fetch file from folder
const fs = require('fs');
const request = require('request');
const path = require('path');
const readline = require('readline');
const {
	port,
	ehr_id
} = require('./config'); //environment variables
const url = `http://localhost:${port}/api/documents`;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// tried using a while loop for continuous input
// unexpected behaviour observed
// need to look into it
rl.question("1. Upload file\n2. Request file\nEnter choice: ", (answer) => {
	if (answer == 1) {
		// step 1: make a POST request to hie.js using request module
		let req = request.post(url, function handleResponse(err, resp, body) {
			if (err) {
				console.log(`Error: ${err}`);
			}
			else {
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

		// multipart/form-data is needed to transfer a file.
		const filepath = './ehr_dir/sample.xml';
		const form = req.form();
		form.append('file', fs.createReadStream(filepath));		// createReadStream() does not contain the actual data of a file, but the path. Try to run it from a different system.
		form.append('pat_id', "123");
		form.append('ehr_id', `${ehr_id}`);
		form.append('doc_id', "456");
		form.append('mrn', "123");
		// We don't need to submit the form manually.
		// Items can be added until the request is fired on the next cycle of the event-loop

		rl.close();
	} else if (answer == 2) {
		// todo - step 2: send a GET request for a ccda & print. Should it be stored on disk?
		const dir_path = './ehr_dir/mrn_cache'			// name of directory to store the files in
		const requested_mrn = '123';
		const get_url = url + '/' + requested_mrn;

		request.get(get_url, function (err, resp, body) {
			if (err)
				console.log(`Error: ${err}`);
			else {
				if (resp.statusCode == 404 || resp.statusCode == 400)
					console.log(body);
				else {
						fs.writeFile(path.join(__dirname, dir_path, requested_mrn + '.xml'), body, function(err, data) {
						if (err)
							console.log(err);
						else {
							console.log("Successfully recieved requested data");
							console.log(body);
						}
					});
				}
			}
		});
	}
	rl.close();
});