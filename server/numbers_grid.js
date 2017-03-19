
const {intRand} = require('./utils');
const {pad} = require('./utils');

function generateGrid(rng) {
   /*
   1) 4 6 1 = 1        => s + a = 10 => a = 6
   2) 0 5 5 = 0        => k = 5
   3) 3 9 7 = 9        => d + q = 10
   4) 0 8 6 = 4        => g + x = 8
   5) 7 8 9 = 4        => q + x = 15

- ajouter 40 à un des 3 premiers  du 1)
- choisir 1 des 3 autres colonnes et ajouter 20 à 2 des 3 premiers
- choisir 1 autre des 3 autres colonnes et ajouter un 30, un 20 et un 10, puis un 100
*/
  var gridValues = [
     [4, 0, 3, 0],
     [6, 5, 9, 8],
     [1, 5, 7, 6]
  ];
  var nbCols = 4;
  var nbRows = 3;
  // Shuffle each column
  for (var iCol = 0; iCol < nbCols; iCol++) {
     var iRow = intRand(rng, nbRows);
     var tmp = gridValues[iRow][iCol];
     gridValues[iRow][iCol] = gridValues[nbRows - 1][iCol];
     gridValues[nbRows - 1][iCol] = tmp;
     if (rng() > 0.5) {
        tmp = gridValues[0][iCol];
        gridValues[0][iCol] = gridValues[1][iCol];
        gridValues[1][iCol] = tmp;
     }
  }
  gridValues[0][0] += 40;
  var iCol = intRand(rng, 3) + 1;
  gridValues[1][iCol] += 20;
  gridValues[2][iCol] += 20;
  iCol ++;
  if (iCol > 3) {
     iCol -= 3;
  }
  var iRow = intRand(rng, 3);
  gridValues[iRow][iCol] += 30;
  gridValues[(iRow + 1) % 3][iCol] += 20;
  gridValues[(iRow + 2) % 3][iCol] += 10;
  iRow = intRand(rng, 3);
  gridValues[iRow % 3][iCol] += 100;

  iCol ++;
  if (iCol > 3) {
     iCol -= 3;
  }
  for (iRow = 0; iRow < nbRows; iRow++) {
     gridValues[iRow][iCol] += 10 * intRand(rng, 20) + 1;
  }


  // Shuffle columns
  for (var iCol = 0; iCol < nbCols; iCol++) {
     var iOtherCol = intRand(rng, nbCols - iCol);
     for (var iRow = 0; iRow < nbRows; iRow++) {
        var tmp = gridValues[iRow][iCol];
        gridValues[iRow][iCol] = gridValues[iRow][iOtherCol];
        gridValues[iRow][iOtherCol] = tmp;
     }
  }


  // Add totals
  for (var iRow = 0; iRow < nbRows; iRow++) {
     var total = 0;
     for (var iCol = 0; iCol < nbCols; iCol++) {
        total += gridValues[iRow][iCol];
     }
     gridValues[iRow].push(total);
  }
  nbCols++;
  gridValues.push([]);
  for (var iCol = 0; iCol < nbCols; iCol++) {
     var total = 0;
     for (var iRow = 0; iRow < nbRows; iRow++) {
        total += gridValues[iRow][iCol];
     }
     gridValues[nbRows].push(total);
  }
  nbRows++;
  return gridValues;
}

/*
function generateGridOld() {

   var gridNbDigits = [
      [1, 2, 3, 2],
      [2, 1, 2, 3],
      [3, 2, 2, 1]
   ];

   var gridValues;
   var goodGrid = false;
   while (!goodGrid) {
      goodGrid = true;
      gridValues = [];
      var colTotals = [];
      var nbRows = gridNbDigits.length;
      var usedDigits = [0,0,0,0,0,0,0,0,0,0];
      for (var iRow = 0; iRow < nbRows; iRow++) {
         var nbCols = gridNbDigits[iRow].length;
         gridValues[iRow] = [];
         var rowTotal = 0;
         for (var iCol = 0; iCol < nbCols; iCol++) {
            if (iRow == 0) {
               colTotals[iCol] = 0;
            }
            var nbDigits = gridNbDigits[iRow][iCol];
            var value = 0;
            if (nbDigits == 3) {
               var digit = intRand(rng, 2);
               value += 100 * digit;
               usedDigits[digit] = 1;
            }
            if (nbDigits >= 2) {
               var digit = intRand(rng, 5)
               usedDigits[digit] = 1;
               value += 10 * digit;
            }
            var digit = intRand(rng, 10);
            usedDigits[digit] = 1;
            value += digit;
            gridValues[iRow].push(value);
            colTotals[iCol] += value;
            rowTotal += value;
         }
         gridValues[iRow].push(rowTotal);
         if (iRow == 0) {
            colTotals[nbCols] = 0;
         }
         colTotals[nbCols] += rowTotal;
      }
      for (var iDigit = 0; iDigit < 10; iDigit++) {
         if (usedDigits[iDigit] == 0) {
            goodGrid = false;
            console.log("bad grid");
            break;
         }
      }
      gridValues.push([]);
      for (var iCol = 0; iCol <= nbCols; iCol++) {
         gridValues[nbRows].push(colTotals[iCol]);
      }
   }
   return gridValues;
}
*/
function isGridValid(gridValues) {
   var nbRows = gridValues.length;
   var nbCols = gridValues[0].length;
   if (gridValues[nbRows - 1][nbCols - 1] > 999) {
      return false;
   }
   return true;
   var nbSubst = countSubstitutions(gridValues);
   console.log("nbSubst : " + nbSubst);
   if (nbSubst != 1) {
      return false;
   }
   return true;
}

function recCountSubstitutions(subst, pos, gridValues, minToStop) {
   if (!checkSubstitution(subst, gridValues)) {
      return 0;
   }
   if (pos == 10) {
      if (!checkSubstitution(subst, gridValues)) {
         return 0;
      }
      console.log(subst);
      return 1;
   }
   if (!checkSubstitution(subst, gridValues)) {
      return 0;
   }
   var nbSubst = 0;
   for (var iVal = 0; iVal < 10; iVal++) {
      var found = false;
      for (var iPos = 0; iPos < pos; iPos++) {
         if (subst[iPos] == iVal) {
            found = true;
            break;
         }
      }
      if (!found) {
         subst[pos] = iVal;
         nbSubst += recCountSubstitutions(subst, pos + 1, gridValues, minToStop - nbSubst);
         subst[pos] = undefined;
         if (nbSubst >= minToStop) {
            return nbSubst;
         }
      }
   }
   return nbSubst;
}

function countSubstitutions(gridValues) {
   var subst = [];
   return recCountSubstitutions(subst, 0, gridValues, 2);
}

function getDigitValue(value, numDigit) {
   var digit = numDigit;
   var remainder = value;
   while (digit != 0) {
      remainder = (remainder - remainder % 10) / 10;
      digit--;
   }
   if ((remainder == 0) && (numDigit != 0)) {
      return undefined;
   }
   return remainder % 10;
}

function checkSubstitution(subst, gridValues) {
   var nbRows = gridValues.length;
   var nbCols = gridValues[0].length;
   var toContinue = false;
   for (var iRow = 0; iRow < nbRows; iRow++) {
      if (toContinue) {
         toContinue = false;
         continue;
      }
      var carry = 0;
      for (var digit = 0; digit < 3; digit++) {
         var digitValue = getDigitValue(gridValues[iRow][nbCols - 1], digit)
         if (digitValue === undefined) {
            toContinue = true;
            break;
         }
         var res = subst[digitValue];
         if (res == undefined) {
            toContinue = true;
            break;
         }
         var sum = carry;
         for (var iCol = 0; iCol < nbCols - 1; iCol++) {
            digitValue = getDigitValue(gridValues[iRow][iCol], digit);
            if (digitValue === undefined) {
               continue;
            }
            var val = subst[digitValue];
            if (val == undefined) {
               sum = undefined;
               break;
            }
            sum += val;
         }
         if (sum == undefined) {
            toContinue = true;
            break;
         }
         if (res % 10 != sum % 10) {
            return false;
         }
         carry = (sum - res) / 10;
      }
   }
   // Same thing for each column
   toContinue = false;
   for (var iCol = 0; iCol < nbCols; iCol++) {
      if (toContinue) {
         toContinue = false;
         continue;
      }
      var carry = 0;
      for (var digit = 0; digit < 3; digit++) {
         var digitValue = getDigitValue(gridValues[nbRows - 1][iCol], digit)
         if (digitValue === undefined) {
            toContinue = true;
            break;
         }
         var res = subst[digitValue];
         if (res == undefined) {
            toContinue = true;
            break;
         }
         var sum = carry;
         for (var iRow = 0; iRow < nbRows - 1; iRow++) {
            digitValue = getDigitValue(gridValues[iRow][iCol], digit);
            if (digitValue === undefined) {
               continue;
            }
            var val = subst[digitValue];
            if (val == undefined) {
               sum = undefined;
               break;
            }
            sum += val;
         }
         if (sum == undefined) {
            toContinue = true;
            break;
         }
         if (res % 10 != sum % 10) {
            return false;
         }
         carry = (sum - res) / 10;
      }
   }
   return true;
}

function gridHorizSeparators(nbCols, nbTextCols) {
   var s = "+";
   for (var iCol = 0; iCol < nbCols; iCol++) {
      s += "---+";
   }
   return s + pad(nbTextCols - s.length) + "\n";
}

function gridToString(gridValues, nbTextCols) {
   var s = "";
   var nbRows = gridValues.length;
   var nbCols = gridValues[0].length;
   s += gridHorizSeparators(nbCols, nbTextCols);
   for (var iRow = 0; iRow < nbRows; iRow++) {
      var sRow = "|";
      for (var iCol = 0; iCol < nbCols; iCol++) {
         var value = gridValues[iRow][iCol];
         var power = 100;
         while ((value < power) && (power > 1)) {
            sRow += " ";
            power /= 10;
         }
         sRow += value;
         sRow += "|";
      }
      sRow += pad(nbTextCols - sRow.length) + "\n";
      s += sRow;
      s += gridHorizSeparators(nbCols, nbTextCols);
   }
   return s;
}

module.exports = function generateGridString(answers, nbTextCols, rng) {
   var gridValues = generateGrid(rng);
   var nbAttempts = 1;
   while (!isGridValid(gridValues)) {
      gridValues = generateGrid(rng);
      nbAttempts++;
      if (nbAttempts > 20) {
         throw new Error('failed to generate a valid grid');
      }
   }
   var nbRows = gridValues.length;
   var nbCols = gridValues[0].length;
   answers.gridTotal = gridValues[nbRows - 1][nbCols - 1];
   return gridToString(gridValues, nbTextCols);
}
