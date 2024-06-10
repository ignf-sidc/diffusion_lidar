
import Feature from "ol/Feature";
import { Polygon} from "ol/geom";

import React from "react";

function handle_mode_change( ref,selectedMode, selectInteractionClick, drawPolygon, drawRectangle) {
    // Cette fonction permet de changer de mode de selection et d'ajouter et supprimer les différentes interactions
    if (selectedMode == "polygon") {
      ref.removeInteraction(selectInteractionClick);
      ref.addInteraction(drawPolygon);
      ref.removeInteraction(drawRectangle);
    } else if (selectedMode == "rectangle") {
      ref.removeInteraction(selectInteractionClick);
      ref.removeInteraction(drawPolygon);
      ref.addInteraction(drawRectangle);
    } else if (selectedMode == "click") {
      ref.addInteraction(selectInteractionClick);
      ref.removeInteraction(drawPolygon);
      ref.removeInteraction(drawRectangle);
    }

}

function handle_upload(info) {
  // fonction appeller lorsqu'on clique sur le bouton pour importer un fichier qui contient un polygon ou multipolygon
  const file = info.file;
  // fonction lancer quand on clique sur le bouton pour upload un fichier si l'on a pas supprimer l'ancien
  // permet pour l'instant d'importer qu'un seul fichier
  handle_upload_remove();
  // si le fichier est bien importer sans erreur
  if (file.status === "done") {
    // si le fichier ne depasse pas 2500km et que tout ce passe bien
    if (file.response.statut == "success") {
      // on convertit notre réponse en json
      const file_geojson = JSON.parse(file.response.polygon);
      let polygonGeometries = null;
      let multiPolygonFeature = null;
      // si c'est un multipolygon
      if (file_geojson.type == "MultiPolygon") {
        // on recupere les coordonnées des multipolygon pour le zoom
        polygonGeometries = file_geojson.coordinates.map(
          (coords) => new Polygon(coords)
        );
        // on convertit nos coordonnées en multipolygon openlayer
        multiPolygonFeature = new Feature({
          geometry: new MultiPolygon(file_geojson.coordinates),
        });
      } else {
        // on convertit nos coordonnées en polygon openlayer
        multiPolygonFeature = new Feature({
          geometry: new Polygon(file_geojson.coordinates),
        });
        polygonGeometries = multiPolygonFeature;
      }
      // on attribue un id, qui permettra de savoir qu'elle dalle sont dans ce polygon
      const id = file.name;
      multiPolygonFeature.setProperties({
        id: id,
      });
      // Ajoutez du polygons à la couche vecteur
      this.vectorSourceFilePolygon.addFeature(multiPolygonFeature);
      this.vectorSourceDrawPolygon.addFeature(multiPolygonFeature);
      // le zoom est différent si c'est un polygon ou un mutlipolygon
      if (file_geojson.type == "MultiPolygon") {
        zoom_to_multi_polygon(polygonGeometries, this.state.mapInstance);
      } else {
        zoom_to_polygon(polygonGeometries, 12, this.state.mapInstance);
      }

      // Utilise setTimeout pour laisser le temps au dalle de se generer sinon il n'arrive pas a selectionner de dalle
      // si on importe un geojson la carte se deplace et doit regenerer des dalles on attend 3 dixiemes
      setTimeout(() => {
        // Sélectionner les dalles
        const status = this.getDalleInPolygon(
          multiPolygonFeature,
          id,
          "polygon_file"
        );
        if (status) {
          message.success(`${file.name} ${file.response.message}`);
        }
      }, 300);
    }
    // si le fichier depasse 2500km
    else {
      message.error(`${file.name} ${file.response.message}`);
      // on met le statut du fichier a 'error', ce qui va permettre de colorier le fichier en rougre
      file.status = "error";
    }
  } else if (file.status === "error") {
    message.error(`${file.name} file upload failed.`);
  }
}
function handle_upload_remove() {
  // fonction appellé lorsqu'on supprime le fichier telecharger
  const polygon = this.vectorSourceFilePolygon.getFeatures()[0];
  if (polygon) {
    remove_dalle_in_polygon(
      polygon,
      this.dalles_select,
      this.vectorSourceGridDalle
    );
    this.setState({ dalles_select: this.dalles_select });
    // Efface les polygones de la couche
    this.vectorSourceFilePolygon.clear();
    this.drawnPolygonsLayer
      .getSource()
      .getFeatures()
      .forEach((polygon_feature) => {
        if (polygon.values_.id == polygon_feature.values_.id) {
          // on lance la fonction qui supprime le polygon en question
          remove_polygon_menu(
            polygon_feature,
            this.drawnPolygonsLayer,
            this.vectorSourceDrawPolygon
          );
        }
      });
  }
}
function handle_telechargement() {
  let contentTxt = "";
  // ajout de chaque dalle dans le contenu du txt
  this.dalles_select.forEach((dalle) => {
    contentTxt += dalle.values_.properties.url_download + "\n";
  });
  // Créer un objet Blob avec le contenu texte
  const blob = new Blob([contentTxt], { type: "text/plain" });
  // Créer une URL pour le Blob
  const blobUrl = URL.createObjectURL(blob);
  // Créer un lien pour le téléchargement du fichier
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = this.name_file_txt;
  a.style.display = "none";
  document.body.appendChild(a);
  // Déclencher le téléchargement
  a.click();
  // Nettoyer après le téléchargement
  URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
}



function handle_get_dalle (dalle, dalles_select, vectorSourceGridDalle, style_dalle) {
  const dalle_polygon = dalle.geometry;
  const dalleFeature = new Feature({
    geometry: new Polygon(dalle_polygon.coordinates),
  });
  const regex = /LHD_FXX_(\d{4}_\d{4})/;
  const name_dalle = dalle.properties.name.match(regex);
  dalleFeature.setProperties({
    properties: {
      id: name_dalle[0],
      url_download: dalle.properties.url,
    },
  });
  // quand on bouge la carte on met le style de dalle selectionner si c'est le cas
  dalles_select.forEach((dalle_select) => {
    if (dalle_select["values_"]["properties"]["id"] === name_dalle[0]) {
      dalleFeature.setStyle(new Style(style_dalle.select));
    }
  });
  // Ajoutez des polygons à la couche vecteur
  vectorSourceGridDalle.addFeature(dalleFeature);
};

export  { 
  handle_mode_change,
  handle_upload,
  handle_upload_remove,
  handle_telechargement,
  handle_get_dalle,
};
