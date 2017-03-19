/* shuffleArray, shuffleString, shuffleRows */

function intRand (rng, maxVal) {
  return Math.trunc(rng() * maxVal);
};

Object.assign(module.exports, {
  intRand,
  shuffleString,
  shuffleArray,
  extractRows,
  shuffleColumns,
  concatRows,
  pad,
  applySubstitution,
  genSubstitution,
  cleanUpSpecialChars
});

function shuffleString (s, rng) {
   var a = []
   for (var iChar = 0; iChar < s.length; iChar++) {
      a.push(s.charAt(iChar));
   }
   var aShuffled = shuffleArray(a, rng);
   var s2 = "";
   for (var iChar = 0; iChar < aShuffled.length; iChar++) {
     s2 += aShuffled[iChar];
   }
   return s2;
}

function shuffleArray (a, rng) {
   var aShuffled = [];
   for (var iChar = 0; iChar < a.length; iChar++) {
      aShuffled.push(a[iChar]);
   }
   for (var iChar = 0; iChar < aShuffled.length; iChar++) {
      var pos = intRand(rng, aShuffled.length - iChar);
      var old = aShuffled[aShuffled.length - iChar - 1];
      aShuffled[aShuffled.length - iChar - 1] = aShuffled[pos];
      aShuffled[pos] = old;
   }
   return aShuffled;
}

function extractRows (s) {
   var rows = [];
   var curRow = [];
   for (var iLetter = 0; iLetter < s.length; iLetter++) {
      if (s.charAt(iLetter) == '\n') {
         rows.push(curRow);
         curRow = [];
      } else {
         curRow.push(s.charAt(iLetter));
      }
   }
   if (curRow.length > 0) {
      rows.push(curRow);
   }
   return rows;
}

/* UNUSED:
function shuffleRows(s, rng) {
   var rows = extractRows(s);
   var res = "";
   return shuffleArray(rows, rng);
}
*/

function shuffleColumns (rows, rng) {
   var nbColumns = rows[0].length
   for (var iCol = 0; iCol < nbColumns; iCol++) {
      var pos = intRand(rng, nbColumns - iCol);
      for (var iRow = 0; iRow < rows.length; iRow++) {
         var old = rows[iRow][nbColumns - iCol - 1];
         rows[iRow][nbColumns - iCol - 1] = rows[iRow][pos];
         rows[iRow][pos] = old;
      }
   }
   return rows;
}

function concatRows (rows) {
   var s = "";
   var nbColumns = rows[0].length
   for (var iRow = 0; iRow < rows.length; iRow++) {
      for (var iCol = 0; iCol < nbColumns; iCol++) {
         s += rows[iRow][iCol];
      }
   }
   return s;
}

function pad (nbSpaces) {
   var s = "";
   for (var iCol = 0; iCol < nbSpaces; iCol++) {
      s += " ";
   }
   return s;
}

function applySubstitution (s, subst) {
   var s2 = "";
   for (var iChar = 0; iChar < s.length; iChar++) {
      var c = s.charAt(iChar);
      if (c in subst) {
         s2 += subst[s.charAt(iChar)];
      } else {
         s2 += c;
      }
   }
   return s2;
}

function genSubstitution (substSymbols, rng) {
   var res = shuffleString(substSymbols, rng);
   var subst = {};
   for (var iSymbol = 0; iSymbol < substSymbols.length; iSymbol++) {
      subst[substSymbols[iSymbol]] = res[iSymbol];
   }
   return subst;
}

function cleanUpSpecialChars (str, withSpaces) {
    str = str.replace(/[ÀÁÂÃÄÅ]/g,"A");
    str = str.replace(/[àáâãäå]/g,"a");
    str = str.replace(/[ÈÉÊË]/g,"E");
    str = str.replace(/[èéêë]/g,"e");
    str = str.replace(/[ÎÏ]/g,"I");
    str = str.replace(/[îï]/g,"i");
    str = str.replace(/[ÔÖ]/g,"O");
    str = str.replace(/[ôö]/g,"o");
    str = str.replace(/[ÙÜÛ]/g,"U");
    str = str.replace(/[ùüû]/g,"u")
    str = str.replace(/[Ç]/g,"C");
    str = str.replace(/[ç]/g,"c");
    str = str.replace(/['-]/g," ");
    str = str.replace(/[^a-zA-Z ]/gi,''); // final clean up
    if (!withSpaces) {
       str = str.replace(/[ ]/g,"");
    }
    return str.toUpperCase();
}
