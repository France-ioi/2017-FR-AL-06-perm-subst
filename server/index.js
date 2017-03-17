
const path = require('path');
const express = require('express');
const alkindiTaskServer = require('alkindi-task-lib/server');

alkindiTaskServer({
  webpackConfig: require('../webpack.config.js'),
  generate,
  gradeAnswer,
  grantHint,
  serverHook: function (app) {
    app.use('/images', express.static(path.resolve(path.dirname(__dirname), 'images')));
  }
});

function generate (params, seed, callback) {
  const cipher_text = "Spicy jalapeno bacon ipsum dolor amet sausage t-bone ribeye spare ribs pancetta kielbasa tenderloin. Tail sirloin ground round swine strip steak shank bacon capicola chicken. Hamburger meatball meatloaf, pork belly fatback ground round brisket chicken ribeye jowl bacon. Tongue picanha rump hamburger. Chicken ground round porchetta, cow shank prosciutto meatball pork loin drumstick. Andouille hamburger ham hock chuck burgdoggen. Frankfurter burgdoggen pig, ham turducken landjaeger bresaola spare ribs kevin ball tip strip steak leberkas andouille sausage prosciutto. Pig chuck filet mignon ground round, salami doner ham rump pork beef cow frankfurter cupim picanha. Capicola pancetta shankle strip steak bresaola tenderloin porchetta chuck meatloaf leberkas t-bone kevin drumstick. Doner ball tip frankfurter brisket turducken tail, shoulder burgdoggen jowl filet mignon pork chop beef ribs. Pork loin shank alcatra rump frankfurter flank venison strip steak jowl pork belly. Meatball tenderloin frankfurter burgdoggen, tail rump spare ribs flank pancetta sausage turkey. Tri-tip drumstick ground round ham t-bone pork belly swine spare ribs chicken corned beef boudin picanha. Bresaola pastrami pork, cow salami fatback alcatra pork loin ground round drumstick picanha brisket doner chuck boudin. Turducken turkey burgdoggen, spare ribs cupim short ribs pig ball tip brisket landjaeger sirloin. Turducken capicola pork chop bacon short ribs picanha porchetta. Jerky prosciutto pig brisket cow ribeye pastrami shankle shoulder spare ribs capicola ground round beef ribs frankfurter. Tenderloin boudin picanha, strip steak short loin kielbasa prosciutto brisket ground round biltong filet mignon. Cupim sausage pig, boudin shankle prosciutto short ribs t-bone alcatra pork loin jerky venison. Beef doner filet mignon, short loin beef ribs flank shoulder t-bone ground round meatball. Kielbasa ball tip bacon, pork chop frankfurter shankle meatball alcatra pig shank. Brisket porchetta burgdoggen strip steak filet mignon t-bone. Pig pancetta beef ribs, hamburger flank chuck jowl ball tip ham. Sausage ham bresaola pastrami, tail alcatra jerky meatloaf short ribs cow hamburger porchetta short loin meatball tongue. Pastrami ball tip strip steak alcatra. Fatback pork loin pork, drumstick prosciutto filet mignon shankle meatball picanha spare ribs turkey kielbasa jowl tail. Pork chop beef frankfurter, corned beef boudin burgdoggen meatloaf filet mignon sausage ribeye tongue venison chicken shankle chuck. Pancetta pork loin burgdoggen meatball tenderloin, jowl pork cupim flank landjaeger. Chicken burgdoggen ground round boudin doner. Cow tenderloin doner, pork loin rump tail pancetta. Does your lorem ipsum text long for something a little meatier? Give our generator a try… it’s tasty!";
  const task = {cipher_text};
  const full_task = Object.assign({}, task, {});
  callback(null, {task, full_task});
}

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
