// for environment configuration
const dotenv = require('dotenv');
dotenv.config(); //read the .env file and set all environment variables

//export all env variables from one file and require any wherever needed
module.exports = {
	port:process.env.PORT,
	ehr_id: process.env.EHR_ID,

	sql_user: process.env.USER,
	sql_pass: process.env.PASSWORD,
	sql_db: process.env.DATABASE,	
	//readable_variable_name: process.env.env_variable_name
}