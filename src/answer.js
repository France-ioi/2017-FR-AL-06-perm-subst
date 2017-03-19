
import React from 'react';
import EpicComponent from 'epic-component';
import {Button, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap';
import update from 'immutability-helper';
//import classnames from 'classnames';

export default function (bundle, deps) {

  const actions = bundle.pack('submitAnswer', 'answerChanged');
  bundle.defineView('Answer', AnswerSelector, Answer(actions));

  bundle.defineAction('answerChanged', 'Answer.Changed');
  bundle.addReducer('answerChanged', function (state, action) {
    const {key, value} = action;
    return update(state, {answer: {[key]: {$set: value}}});
  });

};

function AnswerSelector (state, props) {
  const {answer, submitAnswer, score} = state;
  return {answer, submitAnswer, score};
}

const Answer = actions => EpicComponent(self => {

  function FieldGroup({id, label, help, ...props}) {
    return (
      <FormGroup controlId={id}>
        <ControlLabel>{label}</ControlLabel>
        <FormControl {...props} />
        {help && <HelpBlock>{help}</HelpBlock>}
      </FormGroup>
    );
  }

  const onSubmitAnswer = function () {
    const answer = self.props.answer;
    self.props.dispatch({type: actions.submitAnswer, answer});
  };

  const onDismissAnswerFeedback = function () {
    self.props.dispatch({type: actions.dismissAnswerFeedback});
  };

  const onAnswerChanged = function (event) {
    const key = event.currentTarget.name;
    const value = event.currentTarget.value;
    self.props.dispatch({type: actions.answerChanged, key, value});
  };

  self.render = function () {
    const {answer, submitAnswer, score} = self.props;
    const {feedback} = submitAnswer;
    return (
      <form className="submitBlock">
        <FieldGroup
          id="answerColumns"
          name="nbCols" value={answer.nbCols} onChange={onAnswerChanged}
          type="number"
          label="Quel est le nombre de colonnes choisi pour la grille de chiffrement ?"
          placeholder="nombre" />
        <FieldGroup
          id="answerSentence"
          name="sentence" value={answer.sentence} onChange={onAnswerChanged}
          type="text"
          label="Donnez l’une des phrases du début du document d’origine (lettres majuscules et espaces uniquement)."
          placeholder="phrase" />
        <FieldGroup
          id="answerGridTotal"
          type="number"
          name="gridTotal" value={answer.gridTotal} onChange={onAnswerChanged}
          label="Quel est le nombre de la case en bas à droite de la grille de nombres ?"
          placeholder="nombre" />
        <FieldGroup
          id="answerCountries"
          type="text"
          label="Donnez le nom de deux des 4 pays, en les séparant par une espace."
          name="countries" value={answer.countries} onChange={onAnswerChanged}
          placeholder="2 noms de pays" />
        <FieldGroup
          id="answerPassword1"
          type="text"
          label="Quel est le mot de passe de pierre ?"
          name="user1Password" value={answer.user1Password} onChange={onAnswerChanged}
          placeholder="mot de passe" />
        <FieldGroup
          id="answerPassword2"
          type="text"
          name="user2Password" value={answer.user2Password} onChange={onAnswerChanged}
          label="Quel est le mot de passe (en clair) de l’utilisateur pour lequel il est manquant ?"
          placeholder="mot de passe" />
        <FieldGroup
          id="answerAnimals"
          type="text"
          label="Nommez deux noms d'animaux qui se cachent parmi les mots de passe chiffrés."
          name="animals" value={answer.animals} onChange={onAnswerChanged}
          placeholder="2 noms d'animaux" />
        <Button onClick={onSubmitAnswer} disabled={submitAnswer && submitAnswer.status === 'pending'}>
          {"soumettre"}
        </Button>
        {feedback &&
          <div className="feedbackBlock" onClick={onDismissAnswerFeedback}>
            {feedback.complete === true &&
              <span>
                <i className="fa fa-check" style={{color: 'green'}}/>
                {" Votre réponse est correcte."}
              </span>}
            {feedback.complete === false &&
              <span>
                <i className="fa fa-close" style={{color: 'red'}}/>
                {" Votre réponse est incorrecte ou partiellement correcte."}
              </span>}
          </div>}
        {feedback && <div className="scoreBlock">
          {"Score : "}{score === undefined ? '-' : score}
        </div>}
      </form>
    );
  }

});
