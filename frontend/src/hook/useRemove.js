function remove_dalle_in_polygon(
  polygon,
  dalles_select,
  vectorSourceGridDalle
) {
  // fonction qui surpprime toutes les dalles d'un polygon supprimer
  // liste qui va nous permettre de stocker les dalles qu'on veut supprimer
  var liste_dalle_remove = [];
  // on boucle sur toutes les dalles selctionner
  dalles_select.forEach((dalle) => {
    // si les dalles appartiennent au polygon alors on les ajouter à la liste liste_dalle_remove
    if (dalle.values_.properties.polygon === polygon.values_.id) {
      liste_dalle_remove.push(dalle);
      // on filtre sur les polygons pour recuperer ceux qui sont dans le polygon et enlever leur style select pour remettre celui de base
      vectorSourceGridDalle.getFeatures().filter((feature) => {
        if (feature.values_.properties.id == dalle.values_.properties.id) {
          feature.setStyle(null);
        }
      });
    }
  });
  // on récupere la difference entre la liste ou on stocke les dalles qu'on veut supprimer et celle qui contient
  // toutes les dalles selectionner pour ne recuperer que les dalles en dehors du polygon supprimer
  dalles_select = dalles_select.filter(
    (element) => !liste_dalle_remove.includes(element)
  );
}

function remove_dalle_menu(
  dalle_remove,
  dalles_select,
  vectorSourceGridDalle,
  list_dalle_in_polygon,
  index = null,
  polygon = null
) {
  // fonction qui permet de déselectionner une dalle et de remettre son style à jours
  if (index === null) {
    index = dalles_select.indexOf(dalle_remove);
  }
  // on parcourt la liste des dalles et non celle des dalles selectionner car quand la carte bouge une nouvelle dalle est creer
  // et donc il nous faut recuperer la dalle actuel et non l'ancienne qui certes est au meme endroit mais a des propriétés différentes
  vectorSourceGridDalle.getFeatures().forEach((feature) => {
    // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
    if (feature.values_.properties.id === dalle_remove.values_.properties.id) {
      feature.setStyle(null);
    }
  });
  // on supprime la dalle de la liste
  dalles_select.splice(index, 1);

  if (polygon != null) {
    list_dalle_in_polygon(polygon, "open");
  } else {
    list_dalle_in_polygon(polygon, "close");
  }
}

function remove_polygon_menu(
  polygon,
  drawnPolygonsLayer,
  vectorSourceDrawPolygon,
  dalles_select,
  vectorSourceGridDalle
) {
  // fonction qui permet de supprimer un polygon

  // on parcourt la liste des polygons et on surppimer le polygon en question du layer
  drawnPolygonsLayer
    .getSource()
    .getFeatures()
    .forEach((feature) => {
      // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
      if (feature.values_.id === polygon.values_.id) {
        // Supprimer la fonctionnalité du source du layer
        vectorSourceDrawPolygon.removeFeature(feature);
      }
      // on lance la fonction qui supprime les dalles du polygons supprimer
      remove_dalle_in_polygon(polygon, dalles_select, vectorSourceGridDalle);
    });
}

function remove_all_dalle_menu(
  event,
  vectorSourceGridDalle,
  dalles_select,
  drawnPolygonsLayer
) {
  // fonction lancer pour supprimer toutes les dalles
  // on parcourt la liste des dalles dans la fenetre pour remettre leur design de base
  vectorSourceGridDalle.getFeatures().forEach((feature) => {
    // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
    if (feature.getStyle() !== null) {
      feature.setStyle(null);
    }
  });
  // on remet la liste des dalles selectionner à 0
  dalles_select = [];
  // il n'y a pu de dalle, les polygons n'ont donc pu de dalle dans leurs emprises, on peut donc les supprimer
  drawnPolygonsLayer.getSource().clear();
  // empeche d'ouvrir ou de fermer le collapse quand on appuie sur le bouton pour supprimer
  event.stopPropagation();
}

function remove_all_polygons_menu(
  event,
  drawnPolygonsLayer,
  filePolygonsLayer,
  dalles_select, 
  vectorSourceGridDalle
) {
  console.log(dalles_select);
  // fonction lancer pour supprimer tous les polygons
  // on parcourt la liste des polygons
  drawnPolygonsLayer
    .getSource()
    .getFeatures()
    .forEach((polygon) => {
      // on lance la fonction qui supprime les dalles du polygons supprimer (donc tous les polygons dans cette fonction)
      remove_dalle_in_polygon(polygon, dalles_select, vectorSourceGridDalle);
    });
  // on met la liste des polygons à 0
  if (drawnPolygonsLayer !== undefined) {
    drawnPolygonsLayer.getSource().clear();
  }
  if (filePolygonsLayer !== undefined) {
    filePolygonsLayer.getSource().clear();
  }
  

  // empeche d'ouvrir ou de fermer le collapse quand on appuie sur le bouton pour supprimer
  event.stopPropagation();
}

export {
  remove_dalle_in_polygon,
  remove_dalle_menu,
  remove_polygon_menu,
  remove_all_dalle_menu,
  remove_all_polygons_menu,
};
