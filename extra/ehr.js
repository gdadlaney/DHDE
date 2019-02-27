/*
	Put file description here
*/

/*importing modules*/
const fs = require('fs');
const request = require('request');
const path = require('path');
const readlineSync = require('readline-sync');
var menu = require('node-menu');

/**Envirionment variables */
const {
	port,
	ehr_id,
	HIE_IP,
} = require('./config');


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
		else{
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
	const ccda_cache = "./ccda_cache";
	/**
	//  * Take patient_information from clinic 
	//  */
	console.log("Please enter patient information. Press enter to skip");
	const result = {};
	result.FirstName = readlineSync.question("Enter first_name of patient: ");
	result.LastName = readlineSync.question("Enter last_name of patient: ");
	result.Country = readlineSync.question("Enter country of patient: ");
	result.SSN = readlineSync.question("Enter ssn of patient: ");
	RequestCCDA(result);
	

}	

function RequestCCDA(result){
	console.log("*************************************");
	console.log("Sending POST request");
	request.get(url,{form:result},function(err,resp,body){
		if (err)
			console.log(`Error: ${err}`);
		else {
			if (resp.statusCode == 404 || resp.statusCode == 400)
				console.log(body);
			else {
				console.log(resp.body);
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