
// query = Select * from EMPI where 
result = { first_name: 'Anuj', last_name: '', country: 'India', ssn: '' }
// for(const key in result){
//     if(result[key]){
//         append = key + "=" + first_name;
//         query+=append;
//     }
// }
console.log(Object.keys(result).length);
// Select * from EMPI where  FirstName="Anuj" AND LastName="Pahade";