
import React from 'react';
import EpicComponent from 'epic-component';
import url from 'url';

export default EpicComponent(self => {

  self.render = function () {
    function asset (path) {
      return url.resolve(self.props.baseUrl, path);
    }
    return (
      <div className="taskInstructions">
        <h1>Sujet</h1>
        <p>Dans ce sujet, on vous donne un texte chiffré, duquel vous devez extraire un certain nombre d’informations bien précises. Plus vous trouvez d’informations, plus vous aurez de points. Les équipes ex-aequo sont départagées en fonction du temps mis pour obtenir ces points.</p>
        <h2>Structure du document d’origine :</h2>
        <p>Avant d’être chiffré, le document avait la structure suivante :</p>
        <ul>
          <li>un certain nombre de petites phrases, chacune sur une ligne, toutes en majuscules sans accents, et où chaque signe de ponctuation a été remplacée par une espace.</li>
          <li>une grille contenant 4 rangées et 5 colonnes dont les bordures sont représentées par des caractères spéciaux, l’ensemble occupant une zone de 21 caractères de large et 9 de haut placée tout à gauche. Chaque case de la grille contient un nombre de 1 à 3 chiffres. La dernière colonne contient la somme de chaque ligne, et la dernière ligne contient la somme de chaque colonne.</li>
          <li>le nom de quatre pays A, B, C D, chacun sur une ligne, encodé en une suite de nombres.</li>
          <li>une liste de personnes, chacune sur une ligne, contenant son prénom puis son nom en lettres minuscules sans accents, son mot de passe chiffré, et son mot de passe en clair.</li>
        </ul>

        <h2>Chiffrement utilisé :</h2>
        <p>Le texte décrit ci-dessous a été chiffré de la manière suivante :</p>
        <ol>
          <li>On a choisi un nombre de colonnes au moins égal à la longueur de la plus longue ligne du texte d’origine. On a complété chaque ligne par des espaces pour qu’elle fasse exactement cette longueur.</li>
          <li>On a mélangé au hasard l’ordre des colonnes.</li>
          <li>On a mélangé au hasard l’ordre des lignes.</li>
          <li>On a retiré les retours à la ligne à la fin de chaque ligne, pour former une longue chaîne.</li>
          <li>On a appliqué une substitution : à chaque lettre minuscule, chiffre ou caractère spécial, on a associé un symbole distinct parmi lettres minuscules, chiffres et caractères spéciaux. On a ensuite remplacé toutes les occurrences des caractères, par leur symbole associé.</li>
        </ol>
        <h2>Outils disponnibles</h2>
        <img src={asset("images/image.png")} alt="alt" />
      </div>
    );
  };
});
