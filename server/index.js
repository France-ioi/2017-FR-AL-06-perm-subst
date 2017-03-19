
const path = require('path');
const express = require('express');
const alkindiTaskServer = require('alkindi-task-lib/server');

const generate = require('./generate');

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
  const is_full_solution = false;
  const is_solution = false;
  const feedback = false;
  const score = 0;
  callback(null, {
    success: true, feedback, score, is_solution, is_full_solution
  });
}

function grantHint (full_task, task, query, callback) {
  callback(null, {success: false});
}
