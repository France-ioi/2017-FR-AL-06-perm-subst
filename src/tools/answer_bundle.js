import React from "react";
import {connect} from "react-redux";
import {FormGroup, ControlLabel, FormControl, HelpBlock} from "react-bootstrap";
import update from "immutability-helper";
//import classnames from 'classnames';

function AnswerSelector (state) {
  const {
    dump,
    actions: {answerChanged}
  } = state;

  return {
    answer: dump.answer,
    answerChanged
  };
}

const FieldGroup = ({id, label, help, ...props}) => {
  return (
    <FormGroup controlId={id} validationState={null}>
      <ControlLabel>{label}</ControlLabel>
      <FormControl {...props} />
      <FormControl.Feedback />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
};

class Answer extends React.PureComponent {
  onAnswerChanged = event => {
    const key = event.currentTarget.name;
    const value = event.currentTarget.value;
    this.props.dispatch({type: this.props.answerChanged, key, value});
  };

  render () {
    const {answer} = this.props;
    return (
      <form className="submitBlock">
        <FieldGroup
          id="answerColumns"
          name="nbCols"
          value={answer.nbCols}
          onChange={this.onAnswerChanged}
          type="text"
          label="Quel est le nombre de colonnes choisi pour la grille de chiffrement ?"
          placeholder="nombre"
        />
        <FieldGroup
          id="answerSentence"
          name="sentence"
          value={answer.sentence}
          onChange={this.onAnswerChanged}
          type="text"
          label="Donnez l’une des phrases du début du document d’origine."
          help="Lettres majuscules et espaces uniquement."
          placeholder="phrase"
        />
        <FieldGroup
          id="answerGridTotal"
          type="text"
          name="gridTotal"
          value={answer.gridTotal}
          onChange={this.onAnswerChanged}
          label="Quel est le nombre de la case en bas à droite de la grille de nombres ?"
          placeholder="nombre"
        />
        <FieldGroup
          id="answerCountries"
          type="text"
          label="Donnez le nom de deux des 4 pays, en les séparant par une espace."
          name="countries"
          value={answer.countries}
          onChange={this.onAnswerChanged}
          placeholder="2 noms de pays"
        />
        <FieldGroup
          id="answerPassword1"
          type="text"
          label="Quel est le mot de passe (en clair) de pierre ?"
          name="user1Password"
          value={answer.user1Password}
          onChange={this.onAnswerChanged}
          placeholder="mot de passe"
        />
        <FieldGroup
          id="answerPassword2"
          type="text"
          name="user2Password"
          value={answer.user2Password}
          onChange={this.onAnswerChanged}
          label="Quel est le mot de passe (en clair) de l’utilisateur pour lequel il est manquant ?"
          placeholder="mot de passe"
        />
        <FieldGroup
          id="answerAnimals"
          type="text"
          label="Donner deux des noms d'animaux de la liste cachée parmi les mots de passe chiffrés."
          name="animals"
          value={answer.animals}
          onChange={this.onAnswerChanged}
          help="Mettez les dans l’ordre de votre choix et séparez les par des espaces."
          placeholder="2 noms d'animaux"
        />
      </form>
    );
  }
}

function answerChangedReducer (state, action) {
  const {key, value} = action;
  return update(state, {dump: {answer: {[key]: {$set: value}}}});
}

export default {
  actions: {
    answerChanged: "Answer.Changed"
  },
  actionReducers: {
    answerChanged: answerChangedReducer
  },
  views: {
    Answer: connect(AnswerSelector)(Answer)
  }
};
