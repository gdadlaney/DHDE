const request = require('request');
const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
var menu = require('node-menu');
var Table = require('cli-table');

const {
	port,
	ehr_id,
	HIE_IP,
	CLINIC_ID,
	EHR_PORT,
} = require('./config');

const ehr_store_dir = "./ehr_store";
const ehr_ret_dir = path.join(ehr_store_dir, 'from_blockchain');
const url = `http://${HIE_IP}:${port}/api/documents`;

function AddAssetaudit(){
	request.get(`http://${HIE_IP}:${port}/AddAsset`,(err,resp)=>{
		if(err){
			console.log(err);
		}
		else{
			let AA = JSON.parse(resp.body);
			// console.log(AA);

			
			var table = new Table({
			    head: ['OwnerId', 'PatientId','TimeStamp','Hash'],
			    colWidths:[10,10,40,70]
			});
			for(i=0;i<AA.length;i++){
				let table_data = [];
			    let owner_details = AA[i].resources[0].ownerId;
			    let patient_details = AA[i].resources[0].patId;
			    table.push([owner_details.substr(owner_details.length - 3),patient_details.substr(patient_details.length - 4),new Date(AA[i].timestamp),AA[i].resources[0].hash]);
			    
		 	}
			console.log(table.toString());
		}
	});
}
function PatientCCDAAudit(){
	console.log("Please enter patient information. Press enter to skip");
	const query = {};
	query.FirstName = readlineSync.question("Enter first_name of patient: ");
	query.LastName = readlineSync.question("Enter last_name of patient: ");
	query.Country = readlineSync.question("Enter country of patient: ");
	query.SSN = readlineSync.question("Enter ssn of patient: ");
	
	
	// sending a get request with the query params
	request({url:`http://${HIE_IP}:${port}/PatientCCDAAudit`, qs: query}, function(err, resp, body) {
		if (err)
			console.log(`Error: ${err}`);
		else {
			if (resp.statusCode == 404 || resp.statusCode == 400 || resp.statusCode == 409 || resp.statusCode == 422)
				console.log(body);
			else {
				let AA = JSON.parse(resp.body);
				// console.log(AA);
				var table = new Table({
				    head: ['OwnerId', 'PatientId','TimeStamp','Hash'],
				    colWidths:[10,10,40,70]
				});
				for(i=0;i<AA.length;i++){
					let table_data = [];
				    let owner_details = AA[i].ownerId;
				    let patient_details = AA[i].patId;
				    table.push([owner_details.substr(owner_details.length - 3),patient_details.substr(patient_details.length - 4),new Date(AA[i].lastUpdate),AA[i].hash]);
				    
			 	}
				console.log(table.toString());
			}
		}
	});
}



menu.customHeader(function() {
    process.stdout.write(`\nAuditing for ${CLINIC_ID}\n`);
})
menu.customPrompt(function() {
    process.stdout.write("Enter choice: \n");
})
menu.addDelimiter('-', 40, 'Main Menu')

.addItem(
	'All CCDA uploads',
	AddAssetaudit
)
.addItem(
	'All CCDAs of a patient',
	PatientCCDAAudit
)
.addDelimiter('*', 40)
.start();