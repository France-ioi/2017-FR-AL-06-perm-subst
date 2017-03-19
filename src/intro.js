
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
        <h1>Permutations d'une grille</h1>
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
        <h2>Outils disponibles</h2>
        <p>Vous disposez de deux outils pour vous aider à déchiffrer le texte :</p>
        <h3>1) Édition de la substitution</h3>
        <p>Le premier outil vous permet de définir une substitution appliquée au texte pour le déchiffrer.</p>
        <p>Pour modifier la substitution, déplacez une lettre de sa deuxième rangée (lettre déchiffrée) en la glissant sous la lettre chiffrée de votre choix. Ainsi, si vous pensez que chaque lettre “a” du message chiffré est en fait un “e” dans le message d’origine, déplacez le “e” de la rangée du bas pour le placez sous le “a”.</p>

        <img src={asset("images/substitutions.png")} alt="alt" />

        <p>Dans la pratique, comme les outils ne montrent plus la version chiffrée des symboles, vous pouvez ignorer la ligne du haut (chiffré), et utiliser l’outil comme ceci : si vous voyez un ‘f’ à un endroit où il devrait y avoir un ‘e’ dans le texte, déplacez la lettre ‘e’ de la partie du bas, vers le ‘f’ de la partie du bas.</p>
        <h4>Utilisation des cadenas</h4>
        <p>Vous pouvez cliquer sur les cadenas sous les lettres de la substitution pour marquer celles dont vous êtes certains. Une fois le cadenas activé, la lettre correspondante ne peut plus être déplacée dans la substitution, et est affichée sur fond plus foncé dans tous les outils. Vous éviterez ainsi de les déplacer par erreur. Cliquez de nouveau sur un cadenas pour le désactiver.</p>
        <h3>2) Modification de l’ordre des lignes et des colonnes.</h3>
        <p>Le deuxième outil vous permet de présenter le texte sous la forme d’une grille, dont vous choisissez le nombre de colonnes.</p>
        <p>Commencez par choisir le nombre de colonnes en modifiant le nombre dans la case dédiée, à droite des boutons.</p>

        <img src={asset("images/tools.png")} alt="alt" />

        <p>Vous pouvez ensuite manipuler la grille selon trois modes, activables par les 3 premiers boutons :</p>
        <ul>
          <li>Changement de l’ordre des lignes<br />Dans ce mode, vous pouvez sélectionner une colonne de la grille, puis la déplacer parmi les autres lignes en cliquant sur les flèches haut et bas. Cliquer sur les doubles flèches permet d’envoyer la ligne sélectionnée tout en haut ou tout en bas.</li>
          <li>Changement de l’ordre des colonnes<br />Dans ce mode, vous pouvez sélectionner une ligne de la grille, puis la déplacer parmi les autres colonnes en cliquant sur les flèches droite et gauche. Les doubles flèches envoient la colonne sélectionnée tout à gauche ou tout à droite.</li>
          <li>Sélection de texte<br />Dans ce mode, vous pouvez sélectionner une partie ou l’ensemble du texte, pour par exemple le coller dans votre propre éditeur de texte. Ceci n’est pas nécessaire pour résoudre l’exercice, mais vous pouvez choisir de le faire si vous le souhaitez.</li>
        </ul>
        <p>Attention : lorsque vous changez le nombre de colonnes, toutes les modifications sur l’ordre des lignes et colonnes sont remises à zéro.</p>
        <h2>Réponse aux questions</h2>
        <p>Pour obtenir des points sur cet exercice, il faut répondre correctement à un maximum des questions qui vous sont posées. Vous pouvez tenter autant de soumissions que vous le souhaitez dans la limite de 2 réponses au cours d’une même minute. La soumission qui obtiendra le meilleur score déterminera votre score final pour le 3ème tour.</p>
        <p>À chaque soumission, on vous indiquera pour chaque question, si votre réponse est juste, et vous indiquera votre score total pour cette soumission.</p>
      </div>
    );
  };
});
