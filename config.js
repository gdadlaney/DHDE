// for environment configuration
const dotenv = require('dotenv');
dotenv.config(); //read the .env file and set all environment variables

// handling CLI arguments
// Production IP
const index = process.argv.indexOf("-prod");			// case sensitive
let hie_ip;
if (index > -1)										// prod exists
	hie_ip = process.env.HIE_IP_PROD;
else
	hie_ip = process.env.HIE_IP;

//export all env variables from one file and require any wherever needed
module.exports = {
	HIE_IP: hie_ip,
	PORT: process.env.PORT,
	EHR_PORT: process.env.EHR_PORT,
	CLINIC_ID: process.env.CLINIC_ID,
	ehr_id: process.env.EHR_ID,
	

	sql_user: process.env.USER,
	sql_pass: process.env.PASSWORD,
	sql_db: process.env.DATABASE,	
	//readable_variable_name: process.env.env_variable_name	
}