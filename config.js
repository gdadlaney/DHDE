// for environment configuration
const dotenv    =require('dotenv');
dotenv.config(); //read the .env file and set all environment variables

//export all env variables from one file and require any wherever needed
module.exports  =   {
    port:process.env.PORT,
    ehr_id: process.env.EHR_ID,
    //readable_varaible_name: process.env.env_variable_name
}