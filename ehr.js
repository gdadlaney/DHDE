/*
	Put file description here
*/

const request = require('request');
const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
var menu = require('node-menu');

const {
	port,
	ehr_id,
	HIE_IP,
} = require('./config');

const ehr_store_dir = "./ehr_store";
const ehr_ret_dir = path.join(ehr_store_dir, 'from_blockchain');
const url = `http://${HIE_IP}:${port}/api/documents`;


/**Menu
 */
function UploadFile(){
	const filename = readlineSync.question("Enter name of the file to upload: ");

	const filepath = `./ehr_store/${filename}`;

	let req = request.post(url, function handleResponse(err, resp, body) {
		if (err) {
			console.log(`Error while sending post request: ${err}`);
		}
		else {
				if (resp.statusCode === 400	|| resp.statusCode === 422) {
					const err_msg = body;
					console.log(resp.statusCode + "Error in received response");
					console.log(err_msg);
				}
				else {
						const res_obj = JSON.parse(body);
						console.log(res_obj);
				}
		}
	});

	const form = req.form();
	form.append('file', fs.createReadStream(filepath));
}

function GetPatientInfo(){
	console.log("Please enter patient information. Press enter to skip");
	const query = {};
	query.FirstName = readlineSync.question("Enter first_name of patient: ");
	query.LastName = readlineSync.question("Enter last_name of patient: ");
	query.Country = readlineSync.question("Enter country of patient: ");
	query.SSN = readlineSync.question("Enter ssn of patient: ");
	
	// const query = {FirstName: 'Adam', LastName: 'Hamilton', Country: 'US', };

	// To Refactor
	// request.get(get_url, function(err, resp, body) {
	// sending a get request with the query params
	request({url:url, qs: query}, function(err, resp, body) {
		if (err)
			console.log(`Error: ${err}`);
		else {
			if (resp.statusCode == 404 || resp.statusCode == 400 || resp.statusCode == 409)
				console.log(body);
			else {
				// To Refactor
				const parser = require('xml2json');
				const options = { object: true };
				// console.log(typeof body);		// string, not file descriptor
				const json = parser.toJson(body, options);
				const patInfo = json.ClinicalDocument.recordTarget.patientRole;
				const pat_name_obj = patInfo.patient.name;
				const pat_name = pat_name_obj.given + pat_name_obj.family;

				fs.writeFile(path.join(__dirname, ehr_ret_dir, pat_name+'.xml'), body, function(err, data) {
					if (err)
						console.log(err);
					else {
						console.log(`Successfully recieved requested data & written to file ${pat_name}`);
					}
				});
			}
		}
	});
}	

menu.customHeader(function() {
    process.stdout.write("\nDATA EXCHANGE PLATFORM\n");
})
menu.customPrompt(function() {
    process.stdout.write("Enter choice: \n");
})
menu.addDelimiter('-', 40, 'Main Menu')
.addItem(
	'Upload File',
	UploadFile
)
.addItem(
	'Request File',
	GetPatientInfo
)
.addDelimiter('*', 40)
.start();