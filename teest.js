var hash = require('object-hash');

var bob = {name: 'Bob', stapler: true, friends: [] };
 
// 4b2b30e27699979ce46714253bc2213010db039c 
hash(bob);
hash.keys(bob);

console.log(hash.keys(bob[name]));
