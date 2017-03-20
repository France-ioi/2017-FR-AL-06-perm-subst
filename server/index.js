
const path = require('path');
const express = require('express');
const alkindiTaskServer = require('alkindi-task-lib/server');

const generate = require('./generate');
const {cleanUpSpecialChars} = require('./utils');

alkindiTaskServer({
  webpackConfig: require('../webpack.config.js'),
  generate,
  gradeAnswer,
  grantHint,
  serverHook: function (app) {
    app.use('/images', express.static(path.resolve(path.dirname(__dirname), 'images')));
  }
});

function gradeAnswer (full_task, task, answer, callback) {
  const feedback = {};
  let score = 0;
  let is_full_solution = true;
  let is_solution = false;
  Object.keys(checkers).forEach(function (key) {
    const error = checkers[key](full_task.answers, answer[key]);
    if (!error) {
      score += 100;
      is_solution = true;
    } else {
      is_full_solution = false;
      feedback[key] = error;
    }
  });
  feedback.result = is_solution ? (is_full_solution ? 'exact' : 'partial') : 'wrong';
  callback(null, {
    success: true, feedback, score, is_solution, is_full_solution
  });
}

function grantHint (full_task, task, query, callback) {
  callback(null, {success: false});
}

const checkers = {
  animals: function (expected, submitted) {
    submitted = words(submitted);
    expected = expected.animals.map(x => cleanUpSpecialChars(x.trim(), true));
    if (submitted.length !== 2) {
      return "2 noms d'animaux sont attendus";
    }
    const found = {};
    submitted.forEach(function (sub) {
      if (expected.indexOf(sub) !== -1) {
        found[sub] = true;
      }
    });
    if (Object.keys(found).length !== 2) {
      return "réponse incorrecte";
    }
    return false;
  },
  countries: function (expected, submitted) {
    submitted = words(submitted);
    expected = expected.countries.map(x => cleanUpSpecialChars(x.trim(), true));
    if (submitted.length !== 2) {
      return "2 noms de pays sont attendus";
    }
    const found = {};
    submitted.forEach(function (sub) {
      if (expected.indexOf(sub) !== -1) {
        found[sub] = true;
      }
    });
    if (Object.keys(found).length !== 2) {
      return "réponse incorrecte";
    }
    return false;
  },
  gridTotal: function (expected, submitted) {
    return eqInt(expected.gridTotal, parseInt(submitted));
  },
  nbCols: function (expected, submitted) {
    return eqInt(expected.nbCols, parseInt(submitted));
  },
  sentence: function (expected, submitted) {
    submitted = cleanUpSpecialChars(submitted.trim(), true);
    expected = expected.sentences.map(x => x.trim());
    if (expected.indexOf(submitted) === -1) {
      return "réponse incorrecte";
    }
    return false;
  },
  user1Password: function (expected, submitted) {
    return eqText(submitted.trim(), expected.user1Password.trim());
  },
  user2Password: function (expected, submitted) {
    return eqText(submitted.trim(), expected.user2Password.trim());
  }
};

function words (input) {
  return cleanUpSpecialChars(input.trim(), true).split(/\s+/).sort();
}

function eqInt (expected, submitted) {
  if (submitted === NaN || submitted !== Math.trunc(submitted)) {
    return "réponse invalide, un nombre entier est attendu";
  }
  if (expected !== submitted) {
    return "réponse incorrecte";
  }
  return false;
}

function eqText (expected, submitted) {
  if (expected !== submitted) {
    return "réponse incorrecte";
  }
  return false;
}
