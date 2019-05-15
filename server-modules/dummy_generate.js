
const seedrandom = require('seedrandom');

const {intRand} = require('./utils');

module.exports = generate;

function generate (params, seed, callback) {

   const rng = seedrandom(seed);

   var nbRows = 40;
   var nbCols = 40;
   var allSymbols = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz|+-. ";
   var substSymbols = "0123456789abcdefghijklmnopqrstuvwxyz|+-. ";

   var shuffledText = [];
   while (shuffledText.length < nbRows * nbCols) {
      shuffledText.push(allSymbols.charAt(intRand(rng, allSymbols.length)));
   }
   shuffledText = shuffledText.join('');

   var task = {cipher_text: shuffledText};
   var full_task = task;
   callback(null, {task, full_task});
}

// Run this module directly with node to test it.
if (require.main === module) {
   generate({}, '', function (err, result) {
      if (err) throw err;
      console.log(JSON.stringify(result));
   });
}
