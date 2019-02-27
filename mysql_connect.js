const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
console.log("mysql_connect");
const {
	HIE_IP,
	port,
	CLINIC_ID,
	sql_user, 
	sql_pass, 
	sql_db,
} = require('./config');



async function mysql_connect(){
	const con = await mysql.createConnection({
		host: "localhost",
		user: "root",				// variable from .env does not work, why?
		password: sql_pass,
		database: sql_db,
		Promise: bluebird
	});
	return {con};	
}

module.exports = {
    mysql_connect
};