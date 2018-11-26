// fetch file from folder
const fs = require('fs');
const request = require('request');
const path = require('path');

// step 1: make a POST request to hie.js using request module
const url = 'http://localhost:3000/api/documents';
const req = request.post(url, function (err, resp, body) {
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

// Executes before POST for some reason. Need to know why?
// todo - step 2: send a GET request for a ccda & print. Should it be stored on disk?
const dir_path = './ehr_dir/mrn_cache'			// name of directory to store the files in 
requested_mrn = 'sample';
const get_url = url + '/' + requested_mrn;

request.get(get_url, function (err, resp, body) {
	if (err)
		console.log(`Error: ${err}`);
	else {
		if (body == 'file or directory does not exist')
			console.log(body);
		else {
			
			fs.writeFile(path.join(__dirname, dir_path, requested_mrn + '.xml'), body, function(err, data) {
				if (err)
					console.log(err);
				else
					console.log("Successfully recieved requested data");
					console.log(body);
			});
		}
	}
});