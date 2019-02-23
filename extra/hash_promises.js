async function computeFileHash(file_name, dir_path) {
	const crypto = require('crypto');
	const Q = require('q');

    const deferred = Q.defer();
    const path = require('path');
    const fs = require('fs');

	// the file you want to get the hash   
	const file_path = path.join(__dirname, dir_path, file_name);
	let fd = fs.createReadStream(file_path);
	let hash = crypto.createHash('sha256');
	hash.setEncoding('hex');
	console.log(`Computing hash of ${file_path}`);

	// const asyncGetHash = () => {
	// 	return new Promise((resolve, reject) => {
	// 		fd.on('end', function() {
	// 			hash.end();
	// 			const computed_hash = hash.read();
	// 			// block_data.hash = computed_hash
	// 			console.log(`Hash of file is: ${computed_hash}`);
				
	// 			resolve(computed_hash);
	// 		});
	// 	});
	// }
	// console.log("*****", '0000000000');
	// const computed_hash = await asyncGetHash();
	// // const computed_hash = '26eded583f2d20275cf355707ef371282be76959d6a85a6e4e23ed2f72f4cbc1';
	// console.log("*****", computed_hash);
	// // read all file and pipe it (write it) to the hash object
	// fd.pipe(hash);
	
	// return computed_hash;

	fd.on('end', function() {
		hash.end();
		console.log('Hash of file is.. ', hash.read()); 
        deferred.resolve(hash.read());
    });
    

    fd.pipe(hash);

	return deferred.promise;
}

computeFileHash(file_name="AdamHamilton.xml", dir_path="hie_dir")
.then( (hash) => {
    // block_data.hash = hash;
    console.log("In then...");
    console.log(hash);
})
.catch( (err) => {
    console.log("***", err);
});

// const asyncFileHash = (file_name="AdamHamilton.xml", dir_path="/home/gaurav/mygit/1D/") => {
//     return new Promise((resolve, reject) => {
//         computeFileHash(file_name, dir_path)
//         .then( (hash) => {
//             // block_data.hash = hash;
//             console.log("In then...");
//             resolve(hash);
//         });
//     });
// }

// block_data.hash = await asyncFileHash(file_name, dir_path);
// console.log("After computeFileHash, block_data is: ", block_data);