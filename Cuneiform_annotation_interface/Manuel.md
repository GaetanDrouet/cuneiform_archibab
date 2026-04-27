# Manuel des annotation sur l'interface AnnotTablette

## 1 Sélection du texte
Vous pouvez indiquer en haut à gauche l'id du texte que vous souhaitez annoter. Appuyez sur Entrée pour valider.
Une fois qu'un texte est sélectionné, la liste des images liées au texte que vous voulez annoter s'affiche. 
Si aucune image ne s'affiche, aucune image n'est disponible pour ce texte.
Cliquez sur une image pour le sélectionner.
Une fois qu'un texte et une image sont sélectionnés, la transcription et l'image s'affichent au milieu.

La liste des images que vous aviez commencé d'annoter est aussi disponible en appuyant sur "Charger une sauvegarde".
Vous pouvez alors continuer vos annotations en appuyant sur l'une de ces sauvegardes.

L'id du texte et le nom de l'image apparaissent aussi dans la barre d'adresse. Vous pouvez ainsi aisément vous transmettre les liens des textes à annoter.


## 2 Annotation
En haut du texte, sont affichés les références et les préférences d'affichage.
Appuyez sur la référence vous renvoie à la page Archibab du texte.
Les préférences d'affichage se composent de deux listes déroulantes. Selon vos choix, le texte sera affiché soit en valeurs phonétiques, soit en noms de signe, soit en Unicode de signe, soit en numéros Borger. Vous pouvez afficher jusqu'à 2 apparences pour chaque signe en utilisant les deux listes déroulantes.

### 2.a Annoter un signe
Pour annoter l'image d'un signe, appuyez une fois en haut à gauche du signe, puis une deuxième fois en bas à droite. Un cadre rouge apparaît autour de l'image du signe.
Le signe qui sera annoté est celui qui est entouré de pointillés rouges dans le texte.

Les signes déjà annotés sont affichés en rouge dans le texte. Vous ne pouvez pas les annoter une deuxième fois sans faire un clone (voir 3.b Doubler un signe).

### 2.b Modifier une annotation
Si le cadre de l'annotation n'est pas de la bonne forme, vous pouvez le modifier. Pour cela vous devez passer du mode Ajout au mode Edition.

Le plus simple est de cliquer sur le signe que vous voulez modifier dans le texte (il apparaît logiquement en rouge vu qu'il est annoté). Cela vous fait immédiatement passer en mode Edition. 
De la même façon, si vous cliquez sur une signe non annoté (non rouge), vous passez en mode Ajout.

Une autre méthode est d'appuyer sur le bouton "Passer du mode Ajout au mode Edition" en bas à gauche ou d'appuyer sur la lettre M (raccourci clavier).
La couleur du bouton vous indique dans quel mode vous êtes actuellement : Rouge pour le mode Ajout ; Jaune pour le mode Edition. Attention cependant, le visuel met parfois un peu de temps à s'adapter au raccourci clavier.

Une fois que vous êtes en mode Edition (bouton jaune), sélectionnez le cadre de l'annotation à modifier. 
Des points blancs apparaissent à chaque coin, pour vous confirmer que l'annotation est sélectionnée.
Puis modifiez la forme de l'annotation comme vous le feriez avec une fenêtre. 
Les modifications sont validées une fois que vous cessez de sélectionner cette annotation.

### 2.c Supprimer une annotation
Pour supprimer une annotation, sélectionnez-la comme si vous vouliez la modifier, puis appuyez sur Suppr ou sur Delete (raccourcis clavier).

### 2.d Annuler/Rétablir une annotation
Vous pouvez annuler la dernière création d'annotation ou la dernière suppression d'annotation en appuyant sur Z (raccourci clavier).
Vous pouvez rétablir l'élément que vous avez annulé en appuyant sur Y (raccourci clavier).
Attention, la coloration rouge peut mettre un peu de temps à apparaître dans le texte. Vous pouvez appuyer sur Entrée pour actualiser l'affichage.

### 2.e Se déplacer sur l'image
Lorsque votre curseur passe sur une annotation, le signe correspondant dans le texte affiche un léger fond jaune. De plus, les informations du signe annoté apparaissent dans un cadre noir aux alentours de l'annotation.
Pour déplacer l'image, vous devez appuyer sur l'image et bouger le curseur en restant appuyé (méthode Drag-and-drop).
Appuyez sur le bouton + ou - pour zoomer ou dézoomer sur l'image.
Appuyez sur la maison pour afficher toute l'image dans le lecteur.
Appuyez sur les flèches pour faire pivoter l'image vers la droite ou la gauche.

### 2.f Changer la taille accordée à l'image et au texte
Vous pouvez faire glisser la barre grise qui délimite le texte et l'image pour accorder plus de place à l'un ou à l'autre.

## 3 Modifier un signe
Quand vous cliquez sur une signe, il est sélectionné. Son fond apparaît plus clair/sombre.
Les informations sur le signe sélectionné apparaissent à droite du texte : son Signe, sa valeur phonétique (qu'il a seul ou qu'il partage) et le mot dont il fait partie.

### 3.a Modifier les caractéristiques d'un signe
Les premiers boutons qui apparaissent permettent d'indiquer des caractéristiques pour le signe sélectionné :
- le bouton **semicassé** sert à indiquer que le signe est semicassé dans l'image. Le raccourci clavier est S.
- le bouton **sur bord** sert à indiquer que le signe est déformé parce qu'il apparaît sur le bord de la tablette. Le raccourci clavier est B.
- le bouton **effacé** sert à indiquer que le signe est effacé sur la tablette. Le raccourci clavier est E.
- le bouton **graphie non-standard** sert à indiquer que la façon dont est tracé le signe sur la tablette est anormale. Le raccourci clavier est G.
Si le bouton a déjà cette caractéristique, le bouton apparaît rouge et ré-appuyer permettra d'enlever la caractéristique.

### 3.b Cloner un signe
Les boutons suivants permettent de doubler le signe sélectionné dans le cas où vous voudriez l'annoter plusieurs fois. Cela est utile si le signe est sur une tranche et apparaît deux fois sur l'image, à la fois sur une face et sur un côté par exemple.
- le bouton **Doubler le signe** vous permet d'ajouter une copie du signe dans le texte. Il sert principalement dans le cas où le signe apparaît sur une tranche latérale en plus d'apparaître sur la face ou le revers. Le raccourci clavier est D.
- le bouton **Doubler la ligne** vous permet d'ajouter un clone d'une ligne entière. Il sert principalement dans le cas où une ligne apparaît sur la tranche haute ou basse en plus d'apparaître sur la face ou le revers. Le raccourci clavier est L.
Vous ne pouvez faire qu'un clone de chaque type par signe. 
Les clones apparaissent en italique. 
Pour supprimer un clone, appuyez dessus. Le bouton qui servait à cloner est désormais rose et sert à le supprimer le clone.

### 3.c Ligature d'un signe
Dans le cas où deux signes apparaissent fusionnés ensemble dans le texte, vous pouvez les ligaturer en prenant le second signe et en appuyant sur **Ligaturer au signe précédent**. Vous ne pouvez pas ligaturer un signe qui est déjà annoté (rouge), parce que par définition les signes ligaturés ne peuvent pas être différenciés au niveau de l'image. De plus vous ne pouvez pas non plus ligaturer un signe à un autre signe d'un mot différent.
Vous pouvez aussi déligaturer deux signes, soit que vous avez ligaturés vous-mêmes, soit qui l'ont été par convention (comme ŠUNIGIN). Pour cela, appuyez sur **Déligaturer**.

## 3.d Corriger un signe
La dernière barre vous permet de corriger un signe. Tapez juste le signe par lequel vous souhaitez remplacer celui du signe sélectionné. Une liste de proposition apparaît dans un menu à gauche. Appuyez sur celui souhaité. 
Les caractères spécieux sont disponibles dans le menu au-dessus des suggestions.
Si le menu n'est pas ouvert, vous pouvez forcer son ouverture en appuyant sur le bouton **Š**.

## 3.e Réinitialisez un signe
Si jamais les corrections que vous avez apportez ne vous conviennent pas, vous pouvez réinitialiser le signe sélectionné en appuyant sur le **⟳** rouge en haut à droite.
Cela réinitialisera ses caractéristiques, sa ligature et son signe à ceux indiqués dans la transcription originale. 

# 4 Autres fonctionnalités
Différents boutons en bas à gauche vous donnent accès à d'autres fonctionnalités.

## 4.a Sauvegarder ?
Vos annotations sont sauvegardées en temps réel dans le cache de votre navigateur. Il n'y a donc pas besoin de sauvegarder.
Elles ne sont disponibles que sur ce navigateur sur cet ordinateur et ne vous suivent pas sur d'autres ordinateurs ni ne sont disponibles pour qui que ce soit d'Archibab tant qu'elles n'ont pas été exportées.
Attention, si vous supprimez le cache de votre navigateur, vous les supprimez aussi. Et si vous n'autorisez pas le site à enregistrer un cache (mode incognito par exemple), elles ne sont pas sauvegardées.

## 4.b Réinitialiser l'image
Si vous appuyez sur ce bouton, toutes vos annotations et vos modifications seront supprimées et ne seront plus sauvegardées. Cela permet d'alléger le poids du cache et aussi de ne pas avoir une liste trop longue de tablettes sauvegardées.

## 4.c Importer et Exporter vos annotations
En exportant vos annotations, elles seront téléchargées en format json sur votre ordinateur. Elles pourront ainsi être partagées avec d'autres personnes au moyen du fichier que vous venez de télécharger.
En important des annotations, vous récupérez les annotation que quelqu'un d'autre ou vous même avez exportées. Attention, celles-ci remplacent toutes annotations que vous auriez déjà faites.

## 4.d Changer d'annotateur (seulement hors Archibab)
Si vous n'êtes pas sur Archibab, ce bouton vous permet d'indiquer votre nom pour qu'il soit compris dans les annotations que vous faites. 

## 4.e Guide
Ce bouton vous permet d'ouvrir quelques explications rapide sur l'organisation de cette interface.
