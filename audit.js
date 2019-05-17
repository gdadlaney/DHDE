const request = require('request');
const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
var menu = require('node-menu');
var Table = require('cli-table');
const ls = require('log-symbols');

const {
	PORT,
	ehr_id,
	HIE_IP,
	CLINIC_ID,
	EHR_PORT,
} = require('./config');

const ehr_store_dir = "./ehr_store";
const ehr_ret_dir = path.join(ehr_store_dir, 'from_blockchain');
const url = `http://${HIE_IP}:${PORT}/api/documents`;

function AddAssetaudit(){
	request.get(`http://${HIE_IP}:${PORT}/AddAsset`,(err,resp)=>{
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
function PatientCCDAUploadAudit(){
	console.log("Please enter patient information. Press enter to skip");
	const query = {};
	query.FirstName = readlineSync.question("Enter first_name of patient: ");
	query.LastName = readlineSync.question("Enter last_name of patient: ");
	query.Country = readlineSync.question("Enter country of patient: ");
	query.SSN = readlineSync.question("Enter ssn of patient: ");
	
	
	// sending a get request with the query params
	request({url:`http://${HIE_IP}:${PORT}/PatientCCDAUploadAudit`, qs: query}, function(err, resp, body) {
		if (err)
			console.log(ls.error, `Error: ${err}`);
		else {
			if (resp.statusCode == 404 || resp.statusCode == 400 || resp.statusCode == 409 || resp.statusCode == 422 || resp.statusCode != 200)
				console.log(ls.error, body);
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

function PatientAllCCDARequestAudit(){
	console.log("Please enter patient information. Press enter to skip");
	const query = {};
	query.FirstName = readlineSync.question("Enter first_name of patient: ");
	query.LastName = readlineSync.question("Enter last_name of patient: ");
	query.Country = readlineSync.question("Enter country of patient: ");
	query.SSN = readlineSync.question("Enter ssn of patient: ");


	request({url:`http://${HIE_IP}:${PORT}/api/audit/requests`, qs: query}, function(err, resp, body) {
		if (err)
			console.log(ls.error, `Error: ${err}`);
		else {
			if (resp.statusCode == 404 || resp.statusCode == 400 || resp.statusCode == 409 || resp.statusCode == 422 || resp.statusCode != 200)
				console.log(ls.error, body);
			else {
				// console.log(resp.body);

				let AA = JSON.parse(resp.body);
				// console.log(AA);
				// var table = new Table({
				//     head: ['requesterId','providerId','PatientId','TimeStamp','Hash','Success'],
				//     colWidths:[10,10,10,40,70,10]
				// });
				for(i=0;i<AA.length;i++){
					var j=i+1;
				    console.log("-----------------------------"+"Record "+j+"-----------------------------");
					let table_data = [];

					const hash = AA[i].hash;
					let patId = AA[i].patId;
					
					const docId = AA[i].docId;
					const docName = AA[i].docName;
					const reasonForAccess = AA[i].reasonForAccess;

					let requesterId = AA[i].requesterId;
				    let providerId = AA[i].providerId;
					let success = AA[i].success;
					const errorMessage = AA[i].errorMessage;
					
					const isLocalAccess = (!success && !errorMessage);
					const accessType = isLocalAccess? "Local Access" : "File Transfer and Local Access";

					console.log("accessType: ", accessType);
					console.log("hash: ",hash.substr(27));
					console.log("patId:", patId.substr(patId.length - 4));
					console.log("docId:", docId);
					console.log("docName:", docName);
					console.log("Reason for access:", reasonForAccess);

					if (!isLocalAccess) {
						console.log();
						console.log("Successful transfer:",success);
						console.log("errorMessage:",success);
						console.log("Requester: ",requesterId.substr(requesterId.length - 3));
						console.log("Provider: ",providerId.substr(providerId.length - 3));
					}
				    console.log("------------------------------------------------------------------");
				    // table.push([requesterId.substr(requesterId.length - 3),providerId.substr(providerId.length - 3),patient_details.substr(patient_details.length - 4),new Date(AA[i].timestamp),AA[i].hash],success);
				    
			 	}
				// console.log(table.toString());
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
	'All CCDA uploads of a patient',
	PatientCCDAUploadAudit
).addItem(
	'All requests of a patient data',
	PatientAllCCDARequestAudit
)
.addDelimiter('*', 40)
.start();