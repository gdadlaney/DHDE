const express = require('express');
const app = express();
const mysql = require('mysql');
// const Sequelize = require('sequelize');
const path = require('path');				// easy way to handle file paths
const fs = require('fs');

const dir_path = './hie_dir';			// name of directory to store the files in
const {
	port,
	sql_pass, 
	sql_db,
} = require('./config');		//environment variables
const CLINIC_ID = "PHO"			////////////
// console.log(port, CLINIC_ID, sql_pass);
const request = require('request');

app.get('/', (req, res) => {
	res.send(`Send a GET or POST request to '${CLINIC_ID}/api/documents/'`);
});

// Creation of EMPI
const con = mysql.createConnection({
	host: "localhost",
	user: "root",				// variable from .env does not work, why?
	password: sql_pass,
	database: sql_db,
});

con.connect(function(err) {
	if (err) throw err
	console.log("Mysql connected!");
});

// send file back, given hash
// step 2: send file back, given identification information - sql
app.get(`/${CLINIC_ID}/api/documents/?`, (req, res) => {

	// check transaction (identified by hash)

	// req.query is a dict with all query params
	const requested_hash = req.query['hash'];
	const hash_path = path.join(__dirname, dir_path, requested_hash+".xml");

	// hash check
	
	try {
		fs.statSync(hash_path);		// using statSync instead of readdirSync, as we just need to check if file is present.
		res.sendFile(hash_path);		// convenient method
		console.log(`File: ${requested_hash+".xml"} found & send back successfully`);
	}
	catch (err) {
		console.log('* Error in file lookup');
		if (err.code === 'ENOENT')
			res.status(404).send(`File: ${hash_found+".xml"} does not exist in CCDA Store`);		// 404 : Not FOund
		else
			res.status(400).send(err);			// 400: Bad Request
	}
});

const http = require('http');
const server = http.createServer(app);
server.listen(port, "127.0.0.2");

// app.listen(port, () => console.log(`Listening on port ${port}...`));