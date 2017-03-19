
const seedrandom = require('seedrandom');

const {
   intRand,
   shuffleArray, shuffleColumns, genSubstitution,
   genPermutation, applyPermutationToArray, applyPermutationToColumns,
   extractRows, concatRows, applySubstitution,
   pad, cleanUpSpecialChars
} = require('./utils');

const animals = require('./animals');
const countries = require('./countries');
const firstNames = require('./first_names');
const lastNames = require('./last_names');
const sentences = require('./sentences');
const generateGridString = require('./numbers_grid');

module.exports = generate;

const letters = "abcdefghijklmnopqrstuvwxyz.";

function genMask(nbLetters, rng) {
   var mask = [4];
   for (var iLetter = 0; iLetter < nbLetters - 1; iLetter++) {
      mask.push(intRand(rng, 3) + 2);
   }
   return mask;
}

function applyMask(password, mask) {
   var encrypted = "";
   for (var iLetter = 0; iLetter < password.length; iLetter++) {
      var letter = password.charAt(iLetter);
      var rank = 0;
      if (letter == '.') {
         rank = 26;
      } else {
         rank = letter.charCodeAt(0) - 'a'.charCodeAt(0);
      }
      rank = (rank + mask[iLetter]) % 27;
      encrypted += letters.charAt(rank);
   }
   return encrypted;
}

function genPassword(nbLetters, rng) {
   var password = "";
   for (var iLetter = 0; iLetter < nbLetters; iLetter++) {
      password += letters.charAt(intRand(rng, letters.length));
   }
   return password;
}

function genAnimals(nbLetters, indications, answers, rng) {
   var s = "";
   var animalsUsed = {};
   answers.animals = [];
   indications.nbAnimals = 0;
   while (s.length < nbLetters) {
      var animal = animals[intRand(rng, animals.length)].toLowerCase();
      if (animalsUsed[animal] == undefined) {
         animalsUsed[animal] = true;
         indications.nbAnimals++;
         answers.animals.push(animal);
         s += animal + ".";
      }
   }
   return s;
}

function genUsers(nbLetters, mask, nbCols, indications, answers, rng) {
   var strAnimals = genAnimals(nbLetters, indications, answers, rng);
   var nbUsers = strAnimals.length;
   var paddingFirstName = 13;
   var paddingLastName = 24;
   var listUsers = [];
   var shuffledFirstNames = shuffleArray(firstNames, rng);
   var shuffledLastNames = shuffleArray(lastNames, rng);
   var forcedFirstNames = ["pierre", "wendy", "quentin", "zoe", "kevin", "felix", "joseph", "gabriel", "marc"];
   for (var iUser = 0; iUser < nbUsers; iUser++) {
      var user = "";
      var firstName = shuffledFirstNames[iUser].toLowerCase();
      var lastName = shuffledLastNames[iUser].toLowerCase();
      if (iUser < forcedFirstNames.length) {
         firstName = forcedFirstNames[iUser];
      }
      user += firstName;
      user += pad(paddingFirstName - user.length);
      user += lastName;
      user += pad(paddingLastName - user.length);
      listUsers.push({ name: user, isTarget: (iUser == 0)});
   }
   listUsers.sort(function(user1, user2) {
     var a = user1.name.toLowerCase();
     var b = user2.name.toLowerCase();
     if (a < b){
        return -1;
     }else if (a > b){
       return  1;
     }else{
       return 0;
     }
   });
   var s = "";
   var iNoClear = intRand(rng, nbUsers - 10) + 5;
   for (var iUser = 0; iUser < nbUsers; iUser++) {
      var user = listUsers[iUser];
      var encryptedPassword = strAnimals.charAt(iUser) + genPassword(8, rng);
      var password = applyMask(encryptedPassword, mask);
      var strUser = user.name + encryptedPassword;
      if (user.isTarget) {
         indications.user1Name = user.name;
         answers.user1Password = password;
         if (iUser == iNoClear) {
            iNoClear++;
         }
      }
      if (iUser != iNoClear) {
         strUser += " " + password;
      } else {
         answers.user2Password = password;
      }
      strUser += pad(nbCols - strUser.length);
      s += strUser + "\n";
   }
   return s;
}

function genCountries(nbCols, answers, rng) {
   var shuffledCountries = shuffleArray(countries, rng);
   var strNumbers = "";
   var names = ["A", "B", "C", "D"];
   answers.countries = [];
   for (var iCountry = 0; iCountry < names.length; iCountry++) {
      var strCountry = shuffledCountries[iCountry].toLowerCase();
      answers.countries.push(strCountry);
      var strNumberRow = "NOM DU PAYS " + names[iCountry] + " : ";
      for (var iChar = 0; iChar < strCountry.length; iChar++) {
         var c = strCountry.charAt(iChar);
         if (c == ' ') {
            strNumberRow += " ";
         } else {
            var v = c.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
            strNumberRow += v + " ";
         }
      }
      strNumberRow += pad(nbCols - strNumberRow.length);
      strNumbers += strNumberRow + "\n";
   }
   return strNumbers;
}

function generate (params, seed, callback) {

   const rng = seedrandom(seed);

   var answers = {};
   var indications = {};
   var allTextCols = [43, 44, 45, 46, 47, 48, 49];
   var nbCols = allTextCols[intRand(rng, allTextCols.length)];
   answers.nbCols = nbCols;
   var strSentences = "";
   answers.sentences = [];
   for (var iSentence = 0; iSentence < 10; iSentence++) {
      var sentence = "";
      while (sentence.length < 30 || sentence.length >= nbCols) {
         sentence = sentences[intRand(rng, sentences.length)].toUpperCase();
      }
      sentence = cleanUpSpecialChars(sentence, true);
      sentence += pad(nbCols - sentence.length)+ "\n";
      answers.sentences.push(sentence);
      strSentences += sentence;
   }
   var strCountries = genCountries(nbCols, answers, rng);
   var mask = genMask(9, rng);
   var strUsers = genUsers(25, mask, nbCols, indications, answers, rng);

   var gridString = generateGridString(answers, nbCols, rng);
   var stringAll = strSentences +
                   pad(nbCols) + "\n" +
                   gridString +
                   pad(nbCols) + "\n" +
                   strCountries +
                   pad(nbCols) + "\n" +
                   strUsers;

   var symbols = "abcdefghijklmnopqrstuvwxyz1234567890|+-. ";
   var badSpaceSubst = {" ": true, "-": true, ".": true, "+": true, "|": true};
   var substitution = genSubstitution(symbols, rng);
   while (badSpaceSubst[substitution[" "]]) {
      substitution = genSubstitution(symbols, rng);
   }
   var stringSubst = applySubstitution(stringAll, substitution);

   var rows = extractRows(stringSubst);
   var rowsPermutation = genPermutation(rows.length, rng);
   var colsPermutation = genPermutation(nbCols, rng);
   rows = applyPermutationToArray(rows, rowsPermutation);
   rows = applyPermutationToColumns(rows, colsPermutation);
   var shuffledText = concatRows(rows);

   var task = {
      cipher_text: shuffledText
   };
   var full_task = Object.assign({
      clearText: stringAll,
      substitution,
      rowsPermutation,
      colsPermutation
   }, task);
   callback(null, {task, full_task});
}

// Run this module directly with node to test it.
if (require.main === module) {
   generate({}, '', function (err, result) {
      if (err) throw err;
      console.log(JSON.stringify(result));
   });
}
