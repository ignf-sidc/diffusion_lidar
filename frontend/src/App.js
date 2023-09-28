import React, { Component, createContext, useEffect, useState } from "react";
import { View, Map, Overlay } from "ol";
import axios from "axios";
import Feature from "ol/Feature";
import { Polygon, MultiPolygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Fill, Stroke } from "ol/style";
import { Select, Draw } from "ol/interaction";
import { createBox } from "ol/interaction/Draw.js";
import { Services, olExtended } from "geoportal-extensions-openlayers";
import "../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../node_modules/ol/ol.css";
import { FaTimes, FaMapMarker } from "react-icons/fa";
import { BsChevronDown, BsChevronLeft } from "react-icons/bs";
import { withCookies } from "react-cookie";
import { message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { get as getProjection } from "ol/proj";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { zoom_to_polygon } from "./hook/useZoom";
import {
  remove_all_dalle_menu,
  remove_polygon_menu,
  remove_dalle_menu,
  remove_all_polygons_menu,
} from "./hook/useRemove";
import { handle_upload_remove, handle_mode_change } from "./hook/useHandle";
import { Menu } from "./component/Menu/Menu";

export const MapContext = createContext(null);

export const App = (props) => {
  const { cookies } = props;
  const [MapState, setMapState] = useState({
    coordinate: null,
    showInfobulle: false,
    selectedFeatures: [],
    dalles_select: [],
    polygon_drawn: [],
    polygon_select_list_dalle: { polygon: null, dalles: [] },
    selectedMode: "click",
    coordinate_mouse: null,
    expiresDateCookie: null,
    cookie_zoom_start: cookies.get("zoom") || 6,
    cookie_coor_start: cookies.get("coor") || [
      288074.8449901076, 6247982.515792289,
    ],
    fileUpload: [],
    dalles_select: [],
    polygon_drawn: [],
    old_dalles_select: null,
    selectInteractionClick: null,
    drawPolygon: null,
    drawRectangle: null,
  });
  const [zoom, setZoom] = useState(5);
  const [api_url, setApi_url] = useState();
  const name_file_txt = "liste_dalle.txt";
  const day_cookie_expiration = 7;
  const limit_dalle_select = 2500;
  const zoom_display_dalle = 11;
  let vectorSourceGridDalle = new VectorSource();
  let vectorSourceDrawPolygon = new VectorSource();
  let vectorSourceFilePolygon = new VectorSource();
  let vectorSourceBloc = new VectorSource();
  const dalleLayer = new VectorLayer({
    source: vectorSourceGridDalle,
    style: new Style({
      fill: new Fill({
        color: "rgba(0, 0, 255, 0.1)",
      }),
      stroke: new Stroke({
        color: "black",
        width: 0.5,
      }),
    }),
  });

  const drawnPolygonsLayer = new VectorLayer({
    source: vectorSourceDrawPolygon,
  });
  const filePolygonsLayer = new VectorLayer({
    source: vectorSourceFilePolygon,
  });
  const drawnBlocsLayer = new VectorLayer({
    source: vectorSourceBloc,
  });
  const style_dalle = {
    select: {
      fill: new Fill({
        color: "rgba(112, 119, 122, 0.5)",
      }),
      stroke: new Stroke({
        color: "rgba(112, 119, 122)",
        width: 2,
      }),
    },
    pointer_move_dalle_menu: {
      fill: new Fill({
        color: "yellow",
      }),
      stroke: new Stroke({
        color: "black",
        width: 2,
      }),
    },
  };

  const mapInstance = new Map({
    target: "map",
    layers: [],
    view: new View({
      projection: getProjection("EPSG:2154"),
      center: MapState.cookie_coor_start,
      zoom: MapState.cookie_zoom_start,
      maxZoom: 16,
    }),
  });

  const overlay = new Overlay({
    element: document.getElementById("popup"),
    autoPan: false,
    autoPanAnimation: {
      duration: 250,
    },
  });

  const style_dalle_select = (feature, MapState) => {
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
  };

  const list_dalle_in_polygon = (
    polygon,
    statut,
    MapState,
    drawnPolygonsLayer,
    vectorSourceDrawPolygon,
    vectorSourceGridDalle
  ) => {
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
            if (
              dalle_select.values_.properties.polygon === feature.values_.id
            ) {
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
  };

  const pointer_move_dalle_menu = (id_dalle, style_dalle) => {
    // on parcours la liste des dalles
    vectorSourceGridDalle.getFeatures().forEach((feature) => {
      // son recupere la feature avec la meme id que la dalle survolé dans le menu
      if (feature.values_.properties.id === id_dalle) {
        feature.setStyle(new Style(style_dalle.pointer_move_dalle_menu));
      }
    });
  };

  const quit_pointer_move_dalle_menu = (id_dalle) => {
    // on parcours la liste des dalles
    vectorSourceGridDalle.getFeatures().forEach((feature) => {
      // son recupere la feature avec la meme id que la dalle survolé dans le menu
      if (feature.values_.properties.id === id_dalle) {
        feature.setStyle(new Style(style_dalle.select));
      }
    });
  };

  const get_dalle_in_polygon = (feature, id, type) => {
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
  };

  const draw_emprise = (event, type) => {
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
  };

  const dalle_select_max_alert = (
    emprise,
    enitite_select,
    drawnPolygonsLayer,
    vectorSourceDrawPolygon,
    MapState,
    vectorSourceGridDalle,
    limit_dalle_select
  ) => {
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
  };

  const generate_multipolygon_bloc = (drawnBlocsLayer) => {
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
  };

  const list_dalles = (MapState, vectorSourceGridDalle) => {
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
                onClick={() => zoom_to_polygon(item, 12, mapInstance)}
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
  };

  const features = drawnPolygonsLayer.getSource().getFeatures();

  const list_polygons = (
    <div>
      <h4 style={{ margin: "0" }}>
        Nombre de polygons séléctionnées : {features.length}
      </h4>
      <div className="outer-div">
        {features.map((polygon, index) => (
          <div key={index}>
            <div className="liste_dalle">
              <button
                className="map-icon-button"
                onClick={() =>
                  remove_polygon_menu(
                    polygon,
                    drawnPolygonsLayer,
                    vectorSourceDrawPolygon,
                    dalles_select,
                    vectorSourceGridDalle
                  )
                }
              >
                <FaTimes style={{ color: "red" }} />
              </button>
              <button
                className="map-icon-button"
                onClick={() => zoom_to_polygon(polygon, 12, mapInstance)}
              >
                <FaMapMarker />
              </button>

              {MapState.polygon_select_list_dalle.polygon !== polygon ? (
                <>
                  <button
                    className="map-icon-button"
                    onClick={() => list_dalle_in_polygon(polygon, "open")}
                  >
                    <BsChevronLeft style={{ strokeWidth: "3px" }} />
                  </button>
                  <p>{polygon.values_.id}</p>
                </>
              ) : (
                <>
                  <button
                    className="map-icon-button"
                    onClick={() => list_dalle_in_polygon(polygon, "close")}
                  >
                    <BsChevronDown style={{ strokeWidth: "3px" }} />
                  </button>
                  <p>{polygon.values_.id}</p>
                </>
              )}
            </div>

            {MapState.polygon_select_list_dalle.polygon === polygon ? (
              <div className="dalle-select-polygon">
                {MapState.polygon_select_list_dalle.dalles.mapInstance(
                  (dalle, key) => (
                    <div className="liste_dalle" key={key}>
                      <button
                        className="map-icon-button"
                        onClick={() =>
                          remove_dalle_menu(
                            dalle,
                            dalles_select,
                            vectorSourceGridDalle,
                            list_dalle_in_polygon,
                            null,
                            (polygon = polygon)
                          )
                        }
                      >
                        <FaTimes style={{ color: "red" }} />
                      </button>
                      <button
                        className="map-icon-button"
                        onClick={() => zoom_to_polygon(dalle, 12, mapInstance)}
                      >
                        <FaMapMarker />
                      </button>
                      <a
                        href={dalle.values_.properties.url_download}
                        onMouseEnter={() =>
                          pointer_move_dalle_menu(dalle.values_.properties.id)
                        }
                        onMouseLeave={() =>
                          quit_pointer_move_dalle_menu(
                            dalle.values_.properties.id
                          )
                        }
                      >
                        {dalle.values_.properties.id}
                      </a>
                    </div>
                  )
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  const items_collapse_liste_polygons = [
    {
      key: "1",
      label: "Liste des polygons",
      children: list_polygons,
      extra: (
        <DeleteOutlined
          style={{ color: "red" }}
          onClick={() =>
            remove_all_polygons_menu(
              event,
              drawnPolygonsLayer,
              filePolygonsLayer,
              dalles_select,
              vectorSourceGridDalle
            )
          }
        />
      ),
    },
  ];

  const items_collapse_liste_produit = [
    {
      key: "1",
      label: "Liste des nuages de points classés",
      children: list_dalles,
      extra: (
        <DeleteOutlined
          style={{ color: "red" }}
          onClick={() =>
            remove_all_dalle_menu(
              event,
              vectorSourceGridDalle,
              dalles_select,
              drawnPolygonsLayer
            )
          }
        />
      ),
    },
    {
      key: "2",
      label: "Liste des MNS",
      children: <p>données pas encore disponible</p>,
    },
    {
      key: "3",
      label: "Liste des MNT",
      children: <p>données pas encore disponible</p>,
    },
    {
      key: "4",
      label: "Autres",
      children: <p>données pas encore disponible</p>,
    },
  ];

  useEffect(() => {
    if (MapState) {
      proj4.defs(
        "EPSG:2154",
        "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
      );
      register(proj4);

      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + day_cookie_expiration);
      // expiration des cookies
      setMapState({ ...MapState, expiresDateCookie: expiresDate });

      const appProtocol = window.location.protocol;
      const appHostname = window.location.hostname;
      setApi_url(`${appProtocol}//${appHostname}`);
      console.log(api_url);

      const onSuccess = (config) => {
        // Traitement réussi ici
        createMap(
          MapState,
          mapInstance,
          zoom,
          dalleLayer,
          drawnPolygonsLayer,
          filePolygonsLayer,
          drawnBlocsLayer,
          overlay
        );
      };

      const onFailure = (error) => {
        // Gestion de l'échec ici
        console.error(
          "Erreur lors de la récupération de la configuration :",
          error
        );
      };

      Services.getConfig({
        apiKey: "essentiels",
        onSuccess,
        onFailure,
      });
    }
  }, [api_url]);

  const createMap = (
    MapState,
    mapInstance,
    zoom,
    dalleLayer, // Ajout de la couche qui affichera les polygons
    drawnPolygonsLayer, // ajout de la couche qui affichera le polygon pour séléectionner des dalles
    filePolygonsLayer, // ajout de la couche qui affichera le polygon d'un fichier geojson ou shp
    drawnBlocsLayer,
    overlay
  ) => {
    console.log("hello");

    let layers = mapInstance.getLayers()
    layers.extend([
      new olExtended.layer.GeoportalWMTS({
        layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
      }),
      dalleLayer, // Ajout de la couche qui affichera les polygons
      drawnPolygonsLayer, // ajout de la couche qui affichera le polygon pour séléectionner des dalles
      filePolygonsLayer, // ajout de la couche qui affichera le polygon d'un fichier geojson ou shp
      drawnBlocsLayer, // ajout de la couche qui affichera les blocs
    ])
    console.log('estend');


    const search = new olExtended.control.SearchEngine({ zoomTo: 12 });
    mapInstance.addControl(search);

    const layerSwitcher = new olExtended.control.LayerSwitcher({
      reverse: true,
      groupSelectStyle: "group",
    });
    mapInstance.addControl(layerSwitcher);
    const attributions = new olExtended.control.GeoportalAttribution();
    mapInstance.addControl(attributions);

    // Créer une interaction de sélection pour gérer le survol des polygones
    const selectInteraction = new Select({
      condition: function (event) {
        return event.type === "pointermove";
      },
      layers: [dalleLayer],
    });

    // évenement au survol d'une salle
    selectInteraction.on("select", (event) => {
      if (event.selected.length > 0) {
        const selectedFeature = event.selected[0];
        // quand on survole une dalle cliquer on met le style d'une dalle cliquer
        style_dalle_select(selectedFeature);
      }
      // quand on quitte la dalle survolé
      if (event.deselected.length > 0) {
        if (old_dalles_select !== null) {
          const selected = style_dalle_select(old_dalles_select);
          if (!selected) {
            // si on survol une dalle non cliqué alors on remet le style null
            old_dalles_select.setStyle(null);
          }
        }
      }
      // on stocke la derniere dalle survoler pour modifier le style
      old_dalles_select = selectedFeature;
    });

    const selectInteractionClick = new Select({
      condition: function (event) {
        return event.type === "click";
      },
      layers: [dalleLayer],
    });

    // évenement au click d'une salle
    selectInteractionClick.on("select", (event) => {
      if (event.selected.length > 0) {
        const featureSelect = event.selected[0];
        // variable qui va valider si la dalle est dans liste sur laquelle on boucle
        let newSelect = false;

        if (MapState.dalles_select.length === 0) {
          // au clique sur une dalle pas selectionner on l'ajoute à la liste

          featureSelect.setStyle(new Style(style_dalle.select));
          MapState.dalles_select.push(featureSelect);
        } else {
          MapState.dalles_select.forEach((dalle_select, index) => {
            if (
              dalle_select["values_"]["properties"]["id"] ===
              featureSelect["values_"]["properties"]["id"]
            ) {
              // au clique sur une dalle déjà selectionner on la supprime
              MapState.dalles_select.splice(index, 1);
              featureSelect.setStyle(null);
              // on passe la variable à true pour dire qu'on vient de la selectionner
              newSelect = true;
              list_dalle_in_polygon(null, "close");
            }
          });
          // si la dalle n'est pas à true c'est quelle est dans la liste, donc on la deselectionne
          if (!newSelect) {
            // au clique sur une dalle pas selectionner on l'ajoute à la liste
            featureSelect.setStyle(new Style(style_dalle.select));
            MapState.dalles_select.push(featureSelect);
            dalle_select_max_alert("click", featureSelect);
          }
        }
      }
      // au click d'une dalle, on regarde la dalle qu'on a cliquer juste avant pour lui assigner un style
      // si la dalle qu'on a cliquer avant est dans la liste des dalles selectionner alors on lui ajoute le style d'une dalle selectionner
      if (event.deselected.length > 0) {
        const featureDeselect = event.deselected[0];
        if (MapState.dalles_select.indexOf(event.deselected[0]) > -1) {
          featureDeselect.setStyle(new Style(style_dalle.select));
        } else {
          featureDeselect.setStyle(null);
        }
      }
      setMapState({ ...MapState, dalles_select: dalles_select });
    });

    // Créer une interaction de tracé de polygon
    const drawPolygon = new Draw({
      type: "Polygon",
    });

    drawPolygon.on("drawend", (event) => {
      draw_emprise(event, "polygon");
    });

    const drawRectangle = new Draw({
      type: "Circle",
      geometryFunction: createBox(),
    });

    drawRectangle.on("drawend", (event) => {
      draw_emprise(event, "rectangle");
    });

    const zoomToClickBloc = new Select({
      condition: function (event) {
        return event.type === "click";
      },
      layers: [drawnBlocsLayer],
    });

    zoomToClickBloc.on("select", (event) => {
      zoom_to_polygon(event.selected[0], 11, mapInstance);
      overlay.getElement().style.display = "none";
    });

    // Créer une interaction de sélection pour gérer le survol des blocs
    const selectInteractionBloc = new Select({
      condition: function (event) {
        return event.type === "pointermove";
      },
      layers: [drawnBlocsLayer],
    });

    // évenement au survol d'un bloc
    selectInteractionBloc.on("select", (event) => {
      if (event.selected.length > 0) {
        const selectedFeature = event.selected[0];
        const extent = selectedFeature.values_.geometry.extent_;
        // Calcul du centre de l'extent pour afficher l'overlay par rapport au centre du bloc
        // et non par rapport au coordonnées de la souris
        const centerX = (extent[0] + extent[2]) / 2;
        const centerY = (extent[1] + extent[3]) / 2;

        // Afficher les informations du bloc dans une fenêtre contextuelle (popup)
        overlay.getElement().innerHTML = selectedFeature["values_"]["id"];
        overlay.setPosition([centerX, centerY]);
        overlay.getElement().style.display = "block";

        console.log(overlay.getElement().innerHTML);
      }
    });

    const mouseMoveListener = (event) => {
      const pixel = mapInstance.getEventPixel(event.originalEvent);
      const lonLat = mapInstance.getCoordinateFromPixel(pixel);
      setMapState({ ...MapState, coordinate_mouse: lonLat });
    };

    mapInstance.on("pointermove", mouseMoveListener);

    // Ajout de l'interaction de sélection à la carte
    mapInstance.addInteraction(selectInteractionClick);
    mapInstance.addInteraction(selectInteraction);
    mapInstance.addInteraction(zoomToClickBloc);
    mapInstance.addInteraction(selectInteractionBloc);

    // Créer une couche pour afficher les informations de la dalle survolée

    // Ajoutez la couche à la carte
    mapInstance.addOverlay(overlay);

    // Lorsque qu'on se déplace sur la carte
    mapInstance.on("moveend", () => {
      const view = mapInstance.getView();
      setZoom(view.getZoom());
      // creation du cookie
      const { cookies } = props;
      // on set le cookie à chaque fois qu'on zoom
      cookies.set("zoom", zoom, {
        expires: MapState.expiresDateCookie,
      });
      // on set le cookie avec les coordonnées à chaque fois qu'on bouge sur la carte
      cookies.set("coor", view.getCenter(), {
        expires: MapState.expiresDateCookie,
      });
      // recupere la bbox de la fenetre de son pc
      const extent = view.calculateExtent(mapInstance.getSize());

      // Efface les anciens polygones et blocs
      vectorSourceGridDalle.clear();
      drawnBlocsLayer.getSource().clear();

      if (view.getZoom() >= zoom_display_dalle) {
        // Calcule les coordonnées de la bbox
        const minX = extent[0];
        const minY = extent[1];
        const maxX = extent[2];
        const maxY = extent[3];

        axios
          .get(
            `${MapState.api_url}:8000/data/get/dalles/${minX}/${minY}/${maxX}/${maxY}`
          )
          .then((response) => {
            response.data.result.forEach((dalle) => {
              const dalle_polygon = JSON.parse(dalle.polygon);
              const dalleFeature = new Feature({
                geometry: new Polygon(dalle_polygon.coordinates),
              });
              const regex = /LHD_FXX_(\d{4}_\d{4})/;
              const name_dalle = dalle.name.match(regex);
              dalleFeature.setProperties({
                properties: {
                  id: name_dalle[0],
                  url_download: dalle.name,
                },
              });
              // quand on bouge la carte on met le style de dalle selectionner si c'est le cas
              dalles_select.forEach((dalle_select) => {
                if (
                  dalle_select["values_"]["properties"]["id"] === name_dalle[0]
                ) {
                  dalleFeature.setStyle(new Style(style_dalle.select));
                }
              });
              // Ajoutez des polygons à la couche vecteur
              vectorSourceGridDalle.addFeature(dalleFeature);
            });
          });
      } else {
        setMapState({
          ...MapState,
          selectedMode: handle_mode_change(
            { target: { value: "click" } },
            mapInstance,
            MapState.selectedMode,
            selectInteractionClick,
            drawPolygon,
            drawRectangle
          ),
        });
        generate_multipolygon_bloc(drawnBlocsLayer);
      }
    });
  };

  return (
    <MapContext.Provider value={{ MapState, setMapState, zoom }}>
      <div className="map-container">
        <div id="map"></div>
        <div id="popup" className="ol-popup">
          <div id="popup-content"></div>
        </div>
      </div>
      {MapState.coordinate_mouse ? (
        <div></div>
      ) : (
        <Menu
          zoom_display_dalle={zoom_display_dalle}
          limit_dalle_select={limit_dalle_select}
        />
      )}
    </MapContext.Provider>
  );
};

export default withCookies(App);
