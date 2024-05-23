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

import { Typography } from "antd";

const { Title } = Typography;

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
};

class App extends Component {
  constructor(props) {
    super(props);
    // on défini un state pour savoir quand ouvrir la modal d'information TODO: Reprendre les définitions de state

    this.state = {
      isModalOpen: false,
      coordinate: null,
      showInfobulle: false,
      selectedFeatures: [],
      dalles_select: [],
      polygon_drawn: [],
      mapInstance: null,
      polygon_select_list_dalle: { polygon: null, dalles: [] },
      selectedMode: "click",
      zoom: 5,
      coor_mouse: null,
      zoom_start: 6,
      coor_start: [288074.8449901076, 6247982.515792289],
      api_url: null,
      fileUpload: [],
    };
    this.name_file_txt = "liste_dalle.txt";
    this.dalles_select = [];
    this.polygon_drawn = [];
    this.limit_dalle_select = 2500;
    this.old_dalles_select = null;
    this.selectInteractionClick = null;
    this.drawPolygon = null;
    this.drawRectangle = null;
    this.zoom_dispaly_dalle = 11;
    this.display_couche_gestionnaire = [
      "Plan IGN v2",
      "Photographies aériennes",
    ];
    this.vectorSourceGridDalle = new VectorSource();
    this.vectorSourceDrawPolygon = new VectorSource();
    this.vectorSourceFilePolygon = new VectorSource();
    this.vectorSourceBloc = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSourceGridDalle,
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
    this.drawnPolygonsLayer = new VectorLayer({
      source: this.vectorSourceDrawPolygon,
    });
    this.filePolygonsLayer = new VectorLayer({
      source: this.vectorSourceFilePolygon,
    });
    this.drawnBlocsLayer = new VectorLayer({
      source: this.vectorSourceBloc,
    });
    this.style_dalle = {
      select: {
        fill: new Fill({
          color: "#20bf0a",
        }),
        stroke: new Stroke({
          color: "rgba(112, 119, 122)",
          width: 2,
        }),
      },
      pointer_move_dalle_menu: {
        fill: new Fill({
          color: "#e8f54a",
        }),
        stroke: new Stroke({
          color: "black",
          width: 2,
        }),
      },
    };
  }

  showModal = () => {
    this.setState({ isModalOpen: true });
  };

  handleOk = () => {
    this.setState({ isModalOpen: false });
  };
  handleCancel = () => {
    this.setState({ isModalOpen: false });
  };

  style_dalle_select(feature) {
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
    const status = dalle_select_max_alert(
      emprise,
      enitite_select,
      drawnPolygonsLayer,
      vectorSourceDrawPolygon,
      MapState,
      vectorSourceGridDalle,
      limit_dalle_select
    );
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
    enitite_select,
    vectorSourceGridDalle,
    limit_dalle_select,
    MapState
  ) => {
    // fonction qui permet de limiter les dalles à 2500km
    if (MapState.dalles_select.length >= limit_dalle_select) {
      remove_dalle_menu(
        enitite_select,
        MapState.dalles_select,
        vectorSourceGridDalle,
        list_dalle_in_polygon
      );
      message.error(
        `le nombre de dalles séléctionnées dépasse ${limit_dalle_select} km²`
      );
      return false;
    }
    return true;
  };

  generate_multipolygon_bloc = () => {
    // fonction qui genere les blocs et qui est appellé à chaque fois qu'on bouge la carte, à un certain niveau de zoom
    // on fais appelle à l'api pour recuperer les blocs
    axios
      .get(
        `https://data.geopf.fr/private/wfs/?service=WFS&version=2.0.0&apikey=interface_catalogue&request=GetFeature&typeNames=ta_lidar-hd:bloc&outputFormat=application/json`
      )
      .then((response) => {
        // etant donner qu'on ne trace que les blocs dans la fenetre, à chaque fois qu'on bouge sur la carte, on remet de notre couche vierge
        this.drawnBlocsLayer.getSource().clear();
        // on parcours notre liste de blocs
        response.data.features.forEach((bloc) => {
          // on trace nos bblocs
          const multiPolygonFeature = new Feature({
            geometry: new MultiPolygon(bloc.geometry.coordinates),
          });
          multiPolygonFeature.setProperties({
            id: bloc.properties.name,
            superficie: bloc.properties.area,
          });
          this.vectorSourceBloc.addFeature(multiPolygonFeature);
        });
      });
  };

  handleTelechargement = () => {
    // fonction qui va permettre de telecharger le fichier txt avec son contenu
    // variable qui aura le contenu
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
  };

  handleGetDalle = (dalle) => {
    console.log(dalle);
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
    this.dalles_select.forEach((dalle_select) => {
      if (dalle_select["values_"]["properties"]["id"] === name_dalle[0]) {
        dalleFeature.setStyle(new Style(this.style_dalle.select));
      }
    });
    // Ajoutez des polygons à la couche vecteur
    this.vectorSourceGridDalle.addFeature(dalleFeature);
  };

  componentDidMount() {
    // déclaration de la projection lamb93
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
    let layers = mapInstance.getLayers();
    layers.extend([
      new olExtended.layer.GeoportalWMTS({
        layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
      }),
      dalleLayer, // Ajout de la couche qui affichera les polygons
      drawnPolygonsLayer, // ajout de la couche qui affichera le polygon pour séléectionner des dalles
      filePolygonsLayer, // ajout de la couche qui affichera le polygon d'un fichier geojson ou shp
      drawnBlocsLayer, // ajout de la couche qui affichera les blocs
    ]);

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
        style_dalle_select(selectedFeature, MapState);
      }
      // quand on quitte la dalle survolé
      if (event.deselected.length > 0) {
        if (MapState.old_dalles_select !== null) {
          const selected = style_dalle_select(
            MapState.old_dalles_select,
            MapState
          );
          if (!selected) {
            // si on survol une dalle non cliqué alors on remet le style null
            MapState.old_dalles_select.setStyle(null);
          }
        }
      }
      // on stocke la derniere dalle survoler pour modifier le style
      MapState.old_dalles_select = event.selected[0];
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

        if (MapState.dalles_select.length === 0) {
          // au clique sur une dalle pas selectionner on l'ajoute à la liste

          featureSelect.setStyle(new Style(style_dalle.select));
          const add_dalles = MapState.dalles_select.push(featureSelect);
          setMapState({ ...MapState, dalles_select: [featureSelect] });
        } else {
          // variable qui va valider si la dalle est dans liste sur laquelle on boucle
          let isSelected = false;

          MapState.dalles_select.forEach((dalle_select, index) => {
            if (
              dalle_select["values_"]["properties"]["id"] ===
              featureSelect["values_"]["properties"]["id"]
            ) {
              // Supression de la dalle séléctionné
              MapState.dalles_select.splice(index, 1);
              featureSelect.setStyle(null);
              // La dalle etait séléctionné on passe à true
              isSelected = true;
              list_dalle_in_polygon(null, "close");
            }
          });
          if (!isSelected) {
            // au clique sur une dalle pas selectionner on l'ajoute à la liste
            featureSelect.setStyle(new Style(style_dalle.select));

            const add_dalles = MapState.dalles_select.push(featureSelect);
            setMapState({
              ...MapState,
              dalles_select: [...MapState.dalles_select, featureSelect],
            });
            click_select(
              featureSelect,
              vectorSourceGridDalle,
              limit_dalle_select,
              MapState
            );
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
              `https://data.geopf.fr/private/wfs/?service=WFS&version=2.0.0&apikey=interface_catalogue&request=GetFeature&typeNames=ta_lidar-hd:dalle&outputFormat=application/json&bbox=${minX},${minY},${maxX},${maxY}`
            )
            .then((response) => {
              response.data.features.forEach((dalle) => {
                this.handleGetDalle(dalle);
              });

              // vérification nombre de dalles

              if (response.data.totalFeatures > 5000) {
                
                axios
                  .get(
                    `https://data.geopf.fr/private/wfs/?service=WFS&version=2.0.0&apikey=interface_catalogue&request=GetFeature&typeNames=ta_lidar-hd:dalle&outputFormat=application/json&bbox=${minX},${minY},${maxX},${maxY}&count=5000&startIndex=5000`
                  )
                  .then((response) => {
                    response.data.features.forEach((dalle) => {
                      this.handleGetDalle(dalle);
                    });
                  });
              }
            });
        } else {
          this.handleModeChange({ target: { value: "click" } });
          this.generate_multipolygon_bloc();
        }
      });
    };

    Services.getConfig({
      apiKey: "essentiels",
      onSuccess: createMap,
    });
  }

  render() {
    const list_dalles = (
      <div>
        <div className="outer-div">
          {this.state.dalles_select.map((item, index) => (
            <div className="liste_dalle inner-div" key={index}>
              <button
                className="map-icon-button"
                onClick={() => this.remove_dalle_menu(index, item)}
              >
                <FaTimes style={{ color: "red" }} />
              </button>
              <button
                className="map-icon-button"
                onClick={() => this.zoom_to_polygon(item, 12)}
              >
                <FaMapMarker />
              </button>
              <a
                href={item.values_.properties.url_download}
                onMouseEnter={() =>
                  this.pointerMoveDalleMenu(item.values_.properties.id)
                }
                onMouseLeave={() =>
                  this.quitPointerMoveDalleMenu(item.values_.properties.id)
                }
              >
                {item.values_.properties.id}
              </a>
            </div>
          ))}
        </div>
      </div>
    );

    const drawnPolygonsLayer = this.drawnPolygonsLayer;
    const features = drawnPolygonsLayer.getSource().getFeatures();

    const list_polygons = (
      <div>
        <h4 style={{ margin: "0" }}>
          Nombre de sélections : {features.length}
        </h4>
        <div className="outer-div">
          {features.map((polygon, index) => (
            <div key={index}>
              <div className="liste_dalle">
                <button
                  className="map-icon-button"
                  onClick={() => this.remove_polygon_menu(polygon)}
                >
                  <FaTimes style={{ color: "red" }} />
                </button>
                <button
                  className="map-icon-button"
                  onClick={() => this.zoom_to_polygon(polygon, 12)}
                >
                  <FaMapMarker />
                </button>

                {this.state.polygon_select_list_dalle.polygon !== polygon ? (
                  <>
                    <button
                      className="map-icon-button"
                      onClick={() =>
                        this.list_dalle_in_polygon(polygon, "open")
                      }
                    >
                      <BsChevronLeft style={{ strokeWidth: "3px" }} />
                    </button>
                    <p>{polygon.values_.id}</p>
                  </>
                ) : (
                  <>
                    <button
                      className="map-icon-button"
                      onClick={() =>
                        this.list_dalle_in_polygon(polygon, "close")
                      }
                    >
                      <BsChevronDown style={{ strokeWidth: "3px" }} />
                    </button>
                    <p>{polygon.values_.id}</p>
                  </>
                )}
              </div>

              {this.state.polygon_select_list_dalle.polygon === polygon ? (
                <div className="dalle-select-polygon">
                  {this.state.polygon_select_list_dalle.dalles.map(
                    (dalle, key) => (
                      <div className="liste_dalle" key={key}>
                        <button
                          className="map-icon-button"
                          onClick={() =>
                            this.remove_dalle_menu(null, dalle, polygon)
                          }
                        >
                          <FaTimes style={{ color: "red" }} />
                        </button>
                        <button
                          className="map-icon-button"
                          onClick={() => this.zoom_to_polygon(dalle, 12)}
                        >
                          <FaMapMarker />
                        </button>
                        <a
                          href={dalle.values_.properties.url_download}
                          onMouseEnter={() =>
                            this.pointerMoveDalleMenu(
                              dalle.values_.properties.id
                            )
                          }
                          onMouseLeave={() =>
                            this.quitPointerMoveDalleMenu(
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
        label: "Liste des emprises",
        children: list_polygons,
        extra: (
          <DeleteOutlined
            style={{ color: "red" }}
            onClick={this.remove_all_polygons_menu}
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
            onClick={this.remove_all_dalle_menu}
          />
        ),
      },
      // {
      //     key: '2',
      //     label: 'Liste des MNS',
      //     children: <p>Donnée non disponible.</p>,
      // },
      // {
      //     key: '3',
      //     label: 'Liste des MNT',
      //     children: <p>Donnée non disponible.</p>,
      // },
      // {
      //     key: '4',
      //     label: 'Autres',
      //     children: <p>Donnée non disponible.</p>,
      // },
    ];

    return (
      <>
        <div className="map-container">
          <div id="map"></div>
          <div id="popup" className="ol-popup">
            <div id="popup-content"></div>
          </div>
        </div>

        <div className="menu">
          {this.state.zoom >= this.zoom_dispaly_dalle ? (
            <div className="menu_mode">
              <Card title="Choix du mode de sélection">
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="large"
                >
                  <Radio.Group
                    onChange={this.handleModeChange}
                    value={this.state.selectedMode}
                  >
                    <Radio value={"click"}>Clic</Radio>
                    <Radio value={"polygon"}>Polygone</Radio>
                    <Radio value={"rectangle"}>Rectangle</Radio>
                  </Radio.Group>
                  {/* <Upload
                    maxCount={1}
                    accept=".geojson"
                    action={`${this.state.api_url}/api/upload/geojson`}
                    onChange={this.handleUpload}
                    onRemove={this.handleUploadRemove}
                  >
                    <Button icon={<UploadOutlined />}>
                      Téléverser un GéoJSON (en lambert 93)
                    </Button>
                  </Upload> */}
                </Space>
              </Card>
              <br />
              <Collapse items={items_collapse_liste_polygons}></Collapse>
              <br />
            </div>
          ) : null}

          <div className="dalle-select">
            {this.state.dalles_select.length === 0 ? (
              <h3 className="center">Aucune donnée sélectionnée.</h3>
            ) : (
              <React.Fragment>
                {this.state.dalles_select.length >= this.limit_dalle_select ? (
                  <h5 className="text_red">
                    Nombre de dalles sélectionnées :{" "}
                    {this.state.dalles_select.length}/{this.limit_dalle_select}
                  </h5>
                ) : (
                  <h5>
                    Nombre de dalles sélectionnées :{" "}
                    {this.state.dalles_select.length}/{this.limit_dalle_select}
                  </h5>
                )}
                <Collapse items={items_collapse_liste_produit}></Collapse>
              </React.Fragment>
            )}
          </div>

          {this.state.dalles_select.length > 0 ? (
            <div className="center">
              <Space>
                <Button
                  onClick={this.handleTelechargement}
                  type="default"
                  icon={<DownloadOutlined />}
                  size="large"
                >
                  Télécharger la liste des liens
                </Button>
                <Button
                  type="primary"
                  onClick={this.showModal}
                  icon={<QuestionCircleOutlined />}
                ></Button>
                <Modal
                  title="Comment télécharger les données ?"
                  open={this.state.isModalOpen}
                  onOk={this.handleOk}
                  onCancel={this.handleCancel}
                  width={650}
                  cancelButtonProps={{ style: { display: "none" } }}
                >
                  <div>
                    <ul>
                      <li>
                        Cette interface vous permet de récupérer la liste des
                        données vous intéressent.
                      </li>
                      <li>
                        Pour récupérer les données facilement, il faudra
                        automatiser le téléchargement.
                      </li>
                      <li>
                        Pour cela, vous pouvez utiliser les applicatifs suivants
                        (par exemple) :
                      </li>
                      <ul>
                        <li>
                          <a href="https://www.downthemall.net/">
                            DownThemAll!
                          </a>
                        </li>
                        <li>
                          <a href="https://xtremedownloadmanager.com/">
                            Xtreme Download Manager
                          </a>
                        </li>
                      </ul>
                    </ul>
                    Pour plus d'explications la vidéo suivante vous indique la
                    marche à suivre :
                    <iframe
                      width="560"
                      height="315"
                      src="https://www.youtube.com/embed/-YomQJC6S38?si=ycCCdLbQ4KmMNSqn&amp;start=59"
                      title="YouTube video player"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                    ></iframe>
                  </div>
                </Modal>
              </Space>
            </div>
          ) : null}
        </div>

        {this.state.coor_mouse !== null ? (
          <Card bodyStyle={{ padding: "2px" }} className="coor">
            Coordonnées (lambert 93) :{Math.round(this.state.coor_mouse[0])} -{" "}
            {Math.round(this.state.coor_mouse[1])}
          </Card>
        ) : null}
      </>
    );
  }
}

export default App;
