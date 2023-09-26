function style_dalle_select(feature, MapState) {
  // fonction permettant d'ajuster le style au survol d'une dalle
  // on parcout la liste des dalles selectionner
  for (const dalle_select of MapState.dalles_select) {
    // si la dalle est selectionner alors au survol on lui laisse le style select et on retourne true
    if (
      dalle_select["values_"]["properties"]["id"] ===
      feature["values_"]["properties"]["id"]
    ) {
      feature.setStyle(new Style(style_dalle.select));
      return true;
    }
  }
  // si la dalle n'est pas dans la liste on retourne false
  return false;
}

function list_dalle_in_polygon(
  polygon,
  statut,
  MapState,
  drawnPolygonsLayer,
  vectorSourceDrawPolygon,
  vectorSourceGridDalle
) {
  // fonction qui permet de lister les dalles
  if (statut == "open") {
    let list_dalle_in_polygon = [];
    MapState.dalles_select.forEach((dalle_select) => {
      if (dalle_select.values_.properties.polygon == polygon.values_.id) {
        list_dalle_in_polygon.push(dalle_select);
      }
    });
    // on regarde si il y'a des dalles dans le polygon ou l'on peut consulter les dalles, si il n'y en a pu alors on supprime le polygon
    if (list_dalle_in_polygon.length === 0) {
      remove_polygon_menu(
        polygon,
        drawnPolygonsLayer,
        vectorSourceDrawPolygon,
        MapState.dalles_select,
        vectorSourceGridDalle
      );
      // sinon on laisse le polygon ouvert et on affiche les dalles de ce polygon
    } else {
      setMapState({
        ...MapState,
        polygon_select_list_dalle: {
          polygon: polygon,
          dalles: list_dalle_in_polygon,
        },
      });
    }
  } else {
    // on parcourt la liste des polygons
    drawnPolygonsLayer
      .getSource()
      .getFeatures()
      .forEach((feature) => {
        // boolean qui va qu'on va mettre a false si le polygon a 1 dalle dans son emprise
        let polygonIsEmpty = true;
        // on parcourt la liste des dalles selctionner pour verifier si le polygon à encore au moins 1 dalle dans son emprise
        dalles_select.forEach((dalle_select) => {
          // si une dalle est dans l'emprise du polygon alors on passe polygonIsEmpty a false
          if (dalle_select.values_.properties.polygon === feature.values_.id) {
            polygonIsEmpty = false;
          }
        });
        // si le polygon est a true et n'a donc aucune dalle dans son emprise, alors on supprime le polygon
        if (polygonIsEmpty) {
          // Suppression du polygon qui est vide
          vectorSourceDrawPolygon.removeFeature(feature);
        }
      });
    setMapState({
      ...MapState,
      polygon_select_list_dalle: { polygon: null, dalles: [] },
    });
  }
}

function pointer_move_dalle_menu(id_dalle, style_dalle) {
  // on parcours la liste des dalles
  vectorSourceGridDalle.getFeatures().forEach((feature) => {
    // son recupere la feature avec la meme id que la dalle survolé dans le menu
    if (feature.values_.properties.id === id_dalle) {
      feature.setStyle(new Style(style_dalle.pointer_move_dalle_menu));
    }
  });
}

function quit_pointer_move_dalle_menu(id_dalle) {
  // on parcours la liste des dalles
  vectorSourceGridDalle.getFeatures().forEach((feature) => {
    // son recupere la feature avec la meme id que la dalle survolé dans le menu
    if (feature.values_.properties.id === id_dalle) {
      feature.setStyle(new Style(style_dalle.select));
    }
  });
}

function get_dalle_in_polygon(feature, id, type) {
  // fonction qui permet de selectionner les dalles dans un polygon
  // Récupérer le polygone dessiné
  const polygon = feature.getGeometry();
  // On parcourt les polygones de la grille et on recupere les dalles dans ce polygon pour les selectionner
  vectorSourceGridDalle.getFeatures().forEach((dalle) => {
    if (polygon.intersectsExtent(dalle.values_.geometry.extent_)) {
      // si un polygon est tracé sur des dalles déjà cliquer on ne les rajoute pas
      if (
        dalles_select.every(
          (feature) =>
            feature.values_.properties.id !== dalle.values_.properties.id
        )
      ) {
        dalle.values_.properties.polygon = id;
        dalles_select.push(dalle);
        dalle.setStyle(new Style(style_dalle.select));
      }
    }
  });
  setMapState({ ...MapState, dalles_select: dalles_select });
  const status = dalle_select_max_alert(type, feature);
  return status;
}

function draw_emprise(event, type) {
  // fonction qui permet de dessiner une emprise avec un polygon ou rectangle
  // event est l'evenement du dessin
  // type est soit "rectangle" soit "polygon"
  const feature = event.feature;
  // on ajoute l'id du polygon avec ces coordonnées
  const id = `${type}-${feature
    .getGeometry()
    .getExtent()
    .map((point) => Math.round(point / 1000))
    .join("-")}`;
  feature.setProperties({
    id: id,
  });
  // on ajoute le polygon à la liste des polygons
  drawnPolygonsLayer.getSource().addFeature(feature);

  get_dalle_in_polygon(feature, id, "polygon");
  setMapState({ ...MapState, polygon_drawn: drawnPolygonsLayer });
}

function dalle_select_max_alert(
  emprise,
  enitite_select,
  drawnPolygonsLayer,
  vectorSourceDrawPolygon,
  MapState,
  vectorSourceGridDalle,
  limit_dalle_select
) {
  // fonction qui permet de limiter les dalles à 2500km
  if (MapState.dalles_select.length >= limit_dalle_select) {
    if (emprise == "polygon") {
      remove_polygon_menu(
        enitite_select,
        drawnPolygonsLayer,
        vectorSourceDrawPolygon,
        MapState.dalles_select,
        vectorSourceGridDalle
      );
    } else if (emprise == "polygon_file") {
      handle_upload_remove();
    } else if (emprise == "click") {
      remove_dalle_menu(
        enitite_select,
        MapState.dalles_select,
        vectorSourceGridDalle,
        list_dalle_in_polygon
      );
    }
    message.error(
      `le nombre de dalles séléctionnées dépasse ${limit_dalle_select} km²`
    );
    return false;
  }
  return true;
}
function generate_multipolygon_bloc(drawnBlocsLayer, vectorSourceBloc) {
  axios.get(`http://localhost:8000/data/get/blocs`).then((response) => {
    drawnBlocsLayer.getSource().clear();
    response.data.result.features.forEach((bloc) => {
      const multiPolygonFeature = new Feature({
        geometry: new MultiPolygon(bloc.geometry.coordinates),
      });
      multiPolygonFeature.setProperties({
        id: bloc.properties.Nom_bloc,
        superficie: bloc.properties.Superficie,
      });
      vectorSourceBloc.addFeature(multiPolygonFeature);
    });
  });
}

function list_dalles(MapState, vectorSourceGridDalle) {
  return (
    <div>
      <div className="outer-div">
        {MapState.dalles_select.map((item, index) => (
          <div className="liste_dalle inner-div" key={index}>
            <button
              className="map-icon-button"
              onClick={() =>
                remove_dalle_menu(
                  item,
                  MapState.dalles_select,
                  vectorSourceGridDalle,
                  list_dalle_in_polygon,
                  index
                )
              }
            >
              <FaTimes style={{ color: "red" }} />
            </button>
            <button
              className="map-icon-button"
              onClick={() => zoom_to_polygon(item, 12, MapState.mapInstance)}
            >
              <FaMapMarker />
            </button>
            <a
              href={item.values_.properties.url_download}
              onMouseEnter={() =>
                pointer_move_dalle_menu(item.values_.properties.id)
              }
              onMouseLeave={() =>
                quit_pointer_move_dalle_menu(item.values_.properties.id)
              }
            >
              {item.values_.properties.id}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  style_dalle_select,
  list_dalle_in_polygon,
  pointer_move_dalle_menu,
  quit_pointer_move_dalle_menu,
  get_dalle_in_polygon,
  draw_emprise,
  dalle_select_max_alert,
  generate_multipolygon_bloc,
  list_dalles,
};
