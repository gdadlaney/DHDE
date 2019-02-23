let Crypto = require('crypto-js');
let fs = require('fs');
let hash= Crypto.SHA256(fs.readFileSync("/home/gaurav/mygit/1D/hie_dir/b9829caed3df8290976a6102a3664f3659934ce7b4ec03e4d39328700b6df36c.xml")).toString();
// let hash= Crypto.SHA256(fs.readFileSync("/home/gaurav/mygit/1D/ehr_dir/AdamHamilton.xml")).toString();
console.log(hash);