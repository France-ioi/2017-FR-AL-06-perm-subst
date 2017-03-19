
import React from 'react';
import EpicComponent from 'epic-component';
import {Button, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap';
//import classnames from 'classnames';

export default function (bundle, deps) {

  const actions = bundle.pack('submitAnswer');
  bundle.defineView('Answer', AnswerSelector, Answer(actions));

};

function AnswerSelector (state, props) {
  const {score, submitAnswer} = state;
  return {score, submitAnswer};
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
    const answer = {}; // XXX
    self.props.dispatch({type: actions.submitAnswer, answer});
  };

  const onDismissAnswerFeedback = function () {
    self.props.dispatch({type: actions.dismissAnswerFeedback});
  };

  self.render = function () {
    const {submitAnswer, score} = self.props;
    const {feedback} = submitAnswer;
    return (
      <form className="submitBlock">
        <FieldGroup
          id="answerColumns"
          type="number"
          label="Quel est le nombre de colonnes choisi pour la grille de chiffrement ?"
          placeholder="nombre" />
        <FieldGroup
          id="answerSentence"
          type="text"
          label="Donnez l’une des phrases du début du document d’origine (lettres majuscules et espaces uniquement)."
          placeholder="phrase" />
        <FieldGroup
          id="answerGridNumber"
          type="number"
          label="Quel est le nombre de la case en bas à droite de la grille de nombres ?"
          placeholder="nombre" />
        <FieldGroup
          id="answerCountries"
          type="text"
          label="Donnez le nom de deux des 4 pays, en les séparant par une espace."
          placeholder="2 noms de pays" />
        <FieldGroup
          id="answerPassword1"
          type="text"
          label="Quel est le mot de passe de pierre ?"
          placeholder="mot de passe" />
        <FieldGroup
          id="answerPassword2"
          type="text"
          label="Quel est le mot de passe (en clair) de l’utilisateur pour lequel il est manquant ?"
          placeholder="mot de passe" />
        <FieldGroup
          id="answerCountries"
          type="text"
          label="Nommez deux noms d'animaux qui se cachent parmi les mots de passe chiffrés."
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
