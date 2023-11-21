import React, { Component } from "react";
import { View, Map, Overlay } from "ol";
import axios from "axios";
import Feature from "ol/Feature";
import { Polygon, MultiPolygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Fill, Stroke } from "ol/style";
import { Select, Draw } from "ol/interaction";
import { createBox, createRegularPolygon } from "ol/interaction/Draw.js";
import { Logger, Services, olExtended } from "geoportal-extensions-openlayers";
import "../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../node_modules/ol/ol.css";
import { FaTimes, FaMapMarker } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { BsChevronDown, BsChevronLeft } from "react-icons/bs";
import { withCookies } from "react-cookie";
import { Card, Radio, Space, Button, Upload, message, Collapse } from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { get as getProjection } from "ol/proj";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";

import { Typography } from 'antd';

const { Title } = Typography;
class App extends Component {
  constructor(props) {
    super(props);
    const { cookies } = props;
    this.state = {
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
      expiresDateCookie: null,
      cookie_zoom_start: cookies.get("zoom") || 6,
      cookie_coor_start: cookies.get("coor") || [
        288074.8449901076, 6247982.515792289,
      ],
      api_url: null,
      fileUpload: [],
    };
    this.name_file_txt = "liste_dalle.txt";
    this.day_cookie_expiration = 7;
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

  style_dalle_select(feature) {
    // fonction permettant d'ajuster le style au survol d'une dalle
    // on parcout la liste des dalles selectionner
    for (const dalle_select of this.dalles_select) {
      // si la dalle est selectionner alors au survol on lui laisse le style select et on retourne true
      if (
        dalle_select["values_"]["properties"]["id"] ===
        feature["values_"]["properties"]["id"]
      ) {
        feature.setStyle(new Style(this.style_dalle.select));
        return true;
      }
    }
    // si la dalle n'est pas dans la liste on retourne false
    return false;
  }

  remove_dalle_in_polygon(polygon) {
    // fonction qui surpprime toutes les dalles d'un polygon supprimer
    // liste qui va nous permettre de stocker les dalles qu'on veut supprimer
    var liste_dalle_remove = [];
    // on boucle sur toutes les dalles selectionner
    this.dalles_select.forEach((dalle) => {
      // si les dalles appartiennent au polygon alors on les ajoute à la liste liste_dalle_remove
      if (dalle.values_.properties.polygon === polygon.values_.id) {
        liste_dalle_remove.push(dalle);
        // on filtre sur les polygons pour recuperer ceux qui sont dans le polygon et enlever leur style select pour remettre celui de base
        this.vectorSourceGridDalle.getFeatures().filter((feature) => {
          if (feature.values_.properties.id == dalle.values_.properties.id) {
            feature.setStyle(null);
          }
        });
      }
    });
    // on récupere la difference entre la liste ou on stocke les dalles qu'on veut supprimer et celle qui contient
    // toutes les dalles selectionner pour ne recuperer que les dalles en dehors du polygon supprimer
    this.dalles_select = this.dalles_select.filter(
      (element) => !liste_dalle_remove.includes(element)
    );
  }

  remove_dalle_menu = (index, dalle_remove, polygon = null) => {
    // fonction qui permet de déselectionner une dalle et de remettre son style à jours
    // si l'index de la dalle dans la liste n'est pas specifier, alors on la recupere
    if (index === null) {
      index = this.dalles_select.indexOf(dalle_remove);
    }
    // on parcourt la liste des dalles et non celle des dalles selectionner car quand la carte bouge une nouvelle dalle est creer
    // et donc il nous faut recuperer la dalle actuel et non l'ancienne qui certes est au meme endroit mais a des propriétés différentes
    this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
      // si la dalle que l'on veut deselectionner est dans la liste des vecteurs (afficher sur la carte) de la page alors on enleve le style
      if (
        feature.values_.properties.id === dalle_remove.values_.properties.id
      ) {
        feature.setStyle(null);
      }
    });
    // on supprime la dalle de la liste
    this.dalles_select.splice(index, 1);

    // on met à jours le state dalles_select
    this.setState({ dalles_select: this.dalles_select });
    // permet de mettre à jours la liste des dalles qui sont dans des polygons, et d'ouvrir ou non le cheuvron
    if (polygon != null) {
      this.list_dalle_in_polygon(polygon, "open");
    } else {
      this.list_dalle_in_polygon(polygon, "close");
    }
  };

  remove_polygon_menu = (polygon_remove) => {
    // fonction qui permet de supprimer un polygon

    // on parcourt la liste des polygons et on surppime le polygon en question du layer
    this.drawnPolygonsLayer
      .getSource()
      .getFeatures()
      .forEach((feature) => {
        if (feature.values_.id === polygon_remove.values_.id) {
          // Suppression du polygon
          this.vectorSourceDrawPolygon.removeFeature(feature);
        }
        // on lance la fonction qui supprime les dalles du polygons supprimer
        this.remove_dalle_in_polygon(polygon_remove);
      });
    // on met à jours les state de dalle selectionner et de polygon dessiner
    this.setState({ dalles_select: this.dalles_select });
    this.setState({ polygon_drawn: this.drawnPolygonsLayer });
  };

  remove_all_dalle_menu = (event) => {
    // fonction lancer pour supprimer toutes les dalles
    // on parcourt la liste des dalles dans la fenetre pour remettre leur design de base
    this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
      // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on remet le style de base
      if (feature.getStyle() !== null) {
        feature.setStyle(null);
      }
    });
    // on remet la liste des dalles selectionner à 0
    this.dalles_select = [];
    this.setState({ dalles_select: this.dalles_select });
    // il n'y a pu de dalle, les polygons n'ont donc pu de dalle dans leurs emprises, on peut donc les supprimer
    this.drawnPolygonsLayer.getSource().clear();
    this.setState({ polygon_drawn: this.drawnPolygonsLayer });
    // empeche d'ouvrir ou de fermer le collapse quand on appuie sur le bouton pour supprimer
    event.stopPropagation();
  };

  remove_all_polygons_menu = (event) => {
    // fonction lancer pour supprimer tous les polygons
    // on parcourt la liste des polygons
    this.drawnPolygonsLayer
      .getSource()
      .getFeatures()
      .forEach((polygon) => {
        // on lance la fonction qui supprime les dalles du polygons supprimer (donc tous les polygons dans cette fonction)
        // attention ça ne veut pas dire qu'on supprime toutes les dalles, il y'en a qui peuvent etre selectioner au click
        this.remove_dalle_in_polygon(polygon);
      });
    // on met la liste des polygons à 0
    this.drawnPolygonsLayer.getSource().clear();
    this.filePolygonsLayer.getSource().clear();

    this.setState({ dalles_select: this.dalles_select });
    this.setState({ polygon_drawn: this.drawnPolygonsLayer });
    // empeche d'ouvrir ou de fermer le collapse quand on appuie sur le bouton pour supprimer
    event.stopPropagation();
  };

  zoom_to_polygon = (item, niv_zoom) => {
    // fonction qui permet de zoomer sur un polygon ou une dalle (le terme openlayer pour une dalle est polygon)
    if (item) {
      // recuperation de l'extent de du polygon
      const polygon_extent = item.values_.geometry.extent_;
      const map = this.state.mapInstance;
      map.getView().fit(polygon_extent, { padding: [50, 50, 50, 50] });
      map.getView().setZoom(niv_zoom);
    }
  };

  zoom_to_multi_polygon = (item) => {
    // fonction qui permet de zoomer sur un multi_polygon, n'est utiliser que pour l'import de fichier
    let extent = item[0].getExtent();
    for (let i = 1; i < item.length; i++) {
      extent = extent.concat(item[i].getExtent());
    }
    const map = this.state.mapInstance;
    map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 12 });
  };

  list_dalle_in_polygon = (polygon, statut) => {
    // fonction qui permet de lister les dalles
    // si le statut est open ça veut dire que le cheuvron du polygon en question est ouvert on doit donc lister ses dalles
    if (statut == "open") {
      // liste ou on stockera les dalles du polygon
      var list_dalle_in_polygon = [];
      // on parcout la liste des dalles selectionner pour recuperer celle qui sont dans le polygon
      this.dalles_select.forEach((dalle_select) => {
        if (dalle_select.values_.properties.polygon == polygon.values_.id) {
          list_dalle_in_polygon.push(dalle_select);
        }
      });
      // on regarde si il y'a des dalles dans le polygon ou l'on peut consulter les dalles, si il n'y en a pu alors on supprime le polygon
      if (list_dalle_in_polygon.length === 0) {
        this.remove_polygon_menu(polygon);
        // sinon on laisse le polygon ouvert et on affiche les dalles de ce polygon
      } else {
        this.setState({
          polygon_select_list_dalle: {
            polygon: polygon,
            dalles: list_dalle_in_polygon,
          },
        });
      }
      // si le statut est close, alors on verifie juste que le polygon a encore au moins 1 dalle pour savoir si on doit le supprimer ou non
    } else {
      // on parcourt la liste des polygons
      this.drawnPolygonsLayer
        .getSource()
        .getFeatures()
        .forEach((feature) => {
          // boolean qui va qu'on va mettre a false si le polygon a 1 dalle ou plus dans son emprise
          let polygonIsEmpty = true;
          // on parcourt la liste des dalles selectionner pour verifier si le polygon à encore au moins 1 dalle dans son emprise
          this.dalles_select.forEach((dalle_select) => {
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
            this.vectorSourceDrawPolygon.removeFeature(feature);
          }
        });
      this.setState({
        polygon_select_list_dalle: { polygon: null, dalles: [] },
      });
    }
  };

  handleModeChange = (mode) => {
    this.setState({ selectedMode: mode.target.value }, () => {
      // Cette fonction permet de changer de mode de selection et d'ajouter et supprimer les différentes interactions
      var map = this.state.mapInstance;
      if (this.state.selectedMode == "polygon") {
        map.removeInteraction(this.selectInteractionClick);
        map.addInteraction(this.drawPolygon);
        map.removeInteraction(this.drawRectangle);
      } else if (this.state.selectedMode == "rectangle") {
        map.removeInteraction(this.selectInteractionClick);
        map.removeInteraction(this.drawPolygon);
        map.addInteraction(this.drawRectangle);
      } else if (this.state.selectedMode == "click") {
        map.addInteraction(this.selectInteractionClick);
        map.removeInteraction(this.drawPolygon);
        map.removeInteraction(this.drawRectangle);
      }
    });
  };

  pointerMoveDalleMenu = (id_dalle) => {
    // fonction permettant de colorier une dalle quand on la survole dans le menu
    // on parcours la liste des dalles
    this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
      // on recupere la feature avec la meme id que la dalle survolé dans le menu et on lui assigne le style pointer_move_dalle_menu
      if (feature.values_.properties.id === id_dalle) {
        feature.setStyle(new Style(this.style_dalle.pointer_move_dalle_menu));
      }
    });
  };

  quitPointerMoveDalleMenu = (id_dalle) => {
    // fonction permettant de decolorer une dalle quand on quitte le survole d'une dalle dans le menu
    // on parcours la liste des dalles
    this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
      // on recupere la feature avec la meme id que la dalle survolé dans le menu et on lui applique le style select car la dalle est forcement selectionner
      // pour être survolé dans le menu
      if (feature.values_.properties.id === id_dalle) {
        feature.setStyle(new Style(this.style_dalle.select));
      }
    });
  };

  getDalleInPolygon = (feature, id, type) => {
    // fonction qui permet de selectionner les dalles dans un polygon
    // Récupérer le polygone dessiné
    const polygon = feature.getGeometry();
    // On parcourt les polygones de la grille et on recupere les dalles dans ce polygon pour les selectionner
    this.vectorSourceGridDalle.getFeatures().forEach((dalle) => {
      if (polygon.intersectsExtent(dalle.values_.geometry.extent_)) {
        // si un polygon est tracé sur des dalles déjà cliquer on ne les rajoute pas
        if (
          this.dalles_select.every(
            (feature) =>
              feature.values_.properties.id !== dalle.values_.properties.id
          )
        ) {
          dalle.values_.properties.polygon = id;
          this.dalles_select.push(dalle);
          dalle.setStyle(new Style(this.style_dalle.select));
        }
      }
    });
    this.setState({ dalles_select: this.dalles_select });
    const status = this.dalle_select_max_alert(type, feature);
    return status;
  };

  draw_emprise = (event, type) => {
    // fonction qui permet de dessiner une emprise avec un polygon ou rectangle
    // event est l'evenement du dessin
    // type est soit "rectangle" soit "polygon"
    var feature = event.feature;
    // on ajoute l'id du polygon avec ces coordonnées
    var id = `${type}-${feature
      .getGeometry()
      .getExtent()
      .map((point) => Math.round(point / 1000))
      .join("-")}`;
    feature.setProperties({
      id: id,
    });
    // on ajoute le polygon à la liste des polygons
    this.drawnPolygonsLayer.getSource().addFeature(feature);

    this.getDalleInPolygon(feature, id, "polygon");
    this.setState({ polygon_drawn: this.drawnPolygonsLayer });
  };

  handleUpload = (info) => {
    // fonction appeller lorsqu'on clique sur le bouton pour importer un fichier qui contient un polygon ou multipolygon
    // permet pour l'instant d'importer qu'un seul fichier
    const file = info.file;
    // en cas d'import d'un nouveau fichier sachant qu'on en a deja importer un, on supprime l'ancien
    this.handleUploadRemove();
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
          // si c'est un polygon
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
        // Ajout du polygons à la couche vecteur
        this.vectorSourceFilePolygon.addFeature(multiPolygonFeature);
        this.vectorSourceDrawPolygon.addFeature(multiPolygonFeature);
        // le zoom est différent si c'est un polygon ou un mutlipolygon
        if (file_geojson.type == "MultiPolygon") {
          this.zoom_to_multi_polygon(polygonGeometries);
        } else {
          this.zoom_to_polygon(polygonGeometries, 12);
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
  };

  handleUploadRemove = () => {
    // fonction appellé lorsqu'on supprime le fichier telecharger
    // on recupere le polygon ou multiploygon, vu qu'on ne peut importer qu'un fichier pour l'instant, c'est forcement le premier element de la liste
    const polygon = this.vectorSourceFilePolygon.getFeatures()[0];
    if (polygon) {
      // on supprime toutes les dalles du polygon
      this.remove_dalle_in_polygon(polygon);
      this.setState({ dalles_select: this.dalles_select });
      // Efface les polygones de la couche
      this.vectorSourceFilePolygon.clear();
      this.drawnPolygonsLayer
        .getSource()
        .getFeatures()
        .forEach((polygon_feature) => {
          if (polygon.values_.id == polygon_feature.values_.id) {
            // on lance la fonction qui supprime le polygon en question
            this.remove_polygon_menu(polygon_feature);
          }
        });
    }
  };

  dalle_select_max_alert = (emprise, feature) => {
    // fonction qui permet de limiter les dalles à 2500km
    // emprise etant le type de selection
    if (this.state.dalles_select.length >= this.limit_dalle_select) {
      if (emprise == "polygon") {
        this.remove_dalle_in_polygon(feature);
        this.remove_polygon_menu(feature);
      } else if (emprise == "polygon_file") {
        this.handleUploadRemove();
      } else if (emprise == "click") {
        this.remove_dalle_menu(null, feature);
      }
      message.error(
        `le nombre de dalles sélectionnées dépasse ${this.limit_dalle_select} km²`
      );
      return false;
    }
    return true;
  };

  generate_multipolygon_bloc = () => {
    // fonction qui genere les blocs et qui est appellé à chaque fois qu'on bouge la carte, à un certain niveau de zoom
    // on fais appelle à l'api pour recuperer les blocs
    axios.get(`${this.state.api_url}/api/data/get/blocs`).then((response) => {
      // etant donner qu'on ne trace que les blocs dans la fenetre, à chaque fois qu'on bouge sur la carte, on remet de notre couche vierge
      this.drawnBlocsLayer.getSource().clear();
      // on parcours notre liste de blocs
      response.data.result.features.forEach((bloc) => {
        // on trace nos bblocs
        const multiPolygonFeature = new Feature({
          geometry: new MultiPolygon(bloc.geometry.coordinates),
        });
        multiPolygonFeature.setProperties({
          id: bloc.properties.Nom_bloc,
          superficie: bloc.properties.Superficie,
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

  componentDidMount() {
    // déclaration de la projection lamb93
    proj4.defs(
      "EPSG:2154",
      "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
    );
    register(proj4);

    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + this.day_cookie_expiration);
    // expiration des cookies
    this.setState({ expiresDateCookie: expiresDate });

    var createMap = () => {
      var map = new Map({
        target: "map",
        layers: [
          new olExtended.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS.OVERVIEW",
          }),
          // new olExtended.layer.GeoportalWMTS({
          //     layer: "ORTHOIMAGERY.ORTHOPHOTOS",
          //     visible: false
          // }),
          this.vectorLayer, // Ajout de la couche qui affichera les polygons
          this.drawnPolygonsLayer, // ajout de la couche qui affichera le polygon pour séléectionner des dalles
          this.filePolygonsLayer, // ajout de la couche qui affichera le polygon d'un fichier geojson ou shp
          this.drawnBlocsLayer, // ajout de la couche qui affichera les blocs
        ],
        view: new View({
          projection: getProjection("EPSG:2154"),
          center: this.state.cookie_coor_start,
          zoom: this.state.cookie_zoom_start,
          maxZoom: 16,
        }),
      });

      // on recupere le debut de l'url de l'api
      const appProtocol = window.location.protocol;
      const appHostname = window.location.hostname;
      this.setState({ api_url: `${appProtocol}//${appHostname}` });

      // on stocke la map dans une variable du contructeur, pour pouvoir l'utiliser dans d'autre fonction
      this.setState({ mapInstance: map });

      var search = new olExtended.control.SearchEngine({ zoomTo: 12 });
      map.addControl(search);

      var layerSwitcher = new olExtended.control.LayerSwitcher({
        reverse: true,
        groupSelectStyle: "group",
      });
      map.addControl(layerSwitcher);

      // code qui permet de supprimer les couches du gestionnaire de couche
      // on recupere les layers dans la couche du ggestionnaire
      const layers = document.querySelectorAll(".GPlayerSwitcher_layer");
      layers.forEach((layer) => {
        // on regarde si l'element n'a pas le meme nom que dans la liste des couches qui doivent etre dans le gestionnaire de couche
        // alors on le display none
        if (
          !this.display_couche_gestionnaire.includes(
            layer.firstChild.firstChild.innerHTML
          )
        ) {
          layer.style.display = "none";
        }
      });

      var attributions = new olExtended.control.GeoportalAttribution();
      map.addControl(attributions);

      // Créer une interaction de sélection pour gérer le survol des polygones
      var selectInteraction = new Select({
        condition: function (event) {
          return event.type === "pointermove";
        },
        layers: [this.vectorLayer],
      });

      // évenement au survol d'une salle
      selectInteraction.on("select", (event) => {
        if (event.selected.length > 0) {
          var selectedFeature = event.selected[0];
          // quand on survole une dalle cliquer on met le style d'une dalle cliquer
          this.style_dalle_select(selectedFeature);
        }
        // quand on quitte la dalle survolé
        if (event.deselected.length > 0) {
          if (this.old_dalles_select !== null) {
            var selected = this.style_dalle_select(this.old_dalles_select);
            if (!selected) {
              // si on survol une dalle non cliqué alors on remet le style null
              this.old_dalles_select.setStyle(null);
            }
          }
        }
        // on stocke la derniere dalle survoler pour modifier le style
        this.old_dalles_select = selectedFeature;
      });

      this.selectInteractionClick = new Select({
        condition: function (event) {
          return event.type === "click";
        },
        layers: [this.vectorLayer],
      });

      // évenement au click d'une salle
      this.selectInteractionClick.on("select", (event) => {
        if (event.selected.length > 0) {
          const featureSelect = event.selected[0];
          // variable qui va valider si la dalle est dans liste sur laquelle on boucle
          var newSelect = false;

          if (this.dalles_select.length === 0) {
            // au clique sur une dalle pas selectionner on l'ajoute à la liste

            featureSelect.setStyle(new Style(this.style_dalle.select));
            this.dalles_select.push(featureSelect);
          } else {
            this.dalles_select.forEach((dalle_select, index) => {
              if (
                dalle_select["values_"]["properties"]["id"] ===
                featureSelect["values_"]["properties"]["id"]
              ) {
                // au clique sur une dalle déjà selectionner on la supprime
                this.dalles_select.splice(index, 1);
                featureSelect.setStyle(null);
                // on passe la variable à true pour dire qu'on vient de la selectionner
                newSelect = true;
                this.list_dalle_in_polygon(null, "close");
              }
            });
            // si la dalle n'est pas à true c'est quelle est dans la liste, donc on la deselectionne
            if (!newSelect) {
              // au clique sur une dalle pas selectionner on l'ajoute à la liste
              featureSelect.setStyle(new Style(this.style_dalle.select));
              this.dalles_select.push(featureSelect);
              this.dalle_select_max_alert("click", featureSelect);
            }
          }
        }
        // au click d'une dalle, on regarde la dalle qu'on a cliquer juste avant pour lui assigner un style
        // si la dalle qu'on a cliquer avant est dans la liste des dalles selectionner alors on lui ajoute le style d'une dalle selectionner
        if (event.deselected.length > 0) {
          const featureDeselect = event.deselected[0];
          if (this.dalles_select.indexOf(event.deselected[0]) > -1) {
            featureDeselect.setStyle(new Style(this.style_dalle.select));
          } else {
            featureDeselect.setStyle(null);
          }
        }
        this.setState({ dalles_select: this.dalles_select });
      });

      // Créer une interaction de tracé de polygon
      this.drawPolygon = new Draw({
        type: "Polygon",
      });

      this.drawPolygon.on("drawend", (event) => {
        this.draw_emprise(event, "polygon");
      });

      this.drawRectangle = new Draw({
        type: "Circle",
        geometryFunction: createBox(),
      });

      this.drawRectangle.on("drawend", (event) => {
        this.draw_emprise(event, "rectangle");
      });

      const zoomToClickBloc = new Select({
        condition: function (event) {
          return event.type === "click";
        },
        layers: [this.drawnBlocsLayer],
      });

      zoomToClickBloc.on("select", (event) => {
        this.zoom_to_polygon(event.selected[0], 11);
        overlay.getElement().style.display = "none";
      });

      // Créer une interaction de sélection pour gérer le survol des blocs
      const selectInteractionBloc = new Select({
        condition: function (event) {
          return event.type === "pointermove";
        },
        layers: [this.drawnBlocsLayer],
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
        // permet de recuperer les coordonnées de la souris
        const pixel = map.getEventPixel(event.originalEvent);
        const lonLat = map.getCoordinateFromPixel(pixel);
        this.setState({ coor_mouse: lonLat });
      };

      map.on("pointermove", mouseMoveListener);

      // Ajout de l'interaction de sélection à la carte
      map.addInteraction(this.selectInteractionClick);
      map.addInteraction(selectInteraction);
      map.addInteraction(zoomToClickBloc);
      map.addInteraction(selectInteractionBloc);

      // Créer une couche pour afficher les informations de la dalle survolée
      var overlay = new Overlay({
        element: document.getElementById("popup"),
        autoPan: false,
        autoPanAnimation: {
          duration: 250,
        },
      });

      // Ajoutez la couche à la carte
      map.addOverlay(overlay);

      // Lorsque qu'on se déplace sur la carte
      map.on("moveend", () => {
        var view = map.getView();
        this.setState({ zoom: view.getZoom() });
        // creation du cookie
        const { cookies } = this.props;
        // on set le cookie à chaque fois qu'on zoom
        cookies.set("zoom", this.state.zoom, {
          expires: this.state.expiresDateCookie,
        });
        // on set le cookie avec les coordonnées à chaque fois qu'on bouge sur la carte
        cookies.set("coor", view.getCenter(), {
          expires: this.state.expiresDateCookie,
        });
        // recupere la bbox de la fenetre de son pc
        var extent = view.calculateExtent(map.getSize());

        // Efface les anciens polygones et blocs
        this.vectorSourceGridDalle.clear();
        this.drawnBlocsLayer.getSource().clear();

        if (view.getZoom() >= this.zoom_dispaly_dalle) {
          // Calcule les coordonnées de la bbox
          var minX = extent[0];
          var minY = extent[1];
          var maxX = extent[2];
          var maxY = extent[3];

          axios
            .get(
              `${this.state.api_url}/api/data/get/dalles/${minX}/${minY}/${maxX}/${maxY}`
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
                this.dalles_select.forEach((dalle_select) => {
                  if (
                    dalle_select["values_"]["properties"]["id"] ===
                    name_dalle[0]
                  ) {
                    dalleFeature.setStyle(new Style(this.style_dalle.select));
                  }
                });
                // Ajoutez des polygons à la couche vecteur
                this.vectorSourceGridDalle.addFeature(dalleFeature);
              });
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
      <div>
        <Title level={5} style={{marginLeft: "auto", marginRight: "auto",justifyContent: "center"}}>Site en cours de qualification.</Title>
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
                  <Upload
                    maxCount={1}
                    accept=".geojson"
                    action={`${this.state.api_url}/api/upload/geojson`}
                    onChange={this.handleUpload}
                    onRemove={this.handleUploadRemove}
                  >
                    <Button icon={<UploadOutlined />}>
                      Téléverser un GéoJSON (en lambert 93)
                    </Button>
                  </Upload>
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
              <Button
                onClick={this.handleTelechargement}
                type="default"
                icon={<DownloadOutlined />}
                size="large"
              >
                Télécharger la liste des liens
              </Button>
            </div>
          ) : null}
          {this.state.coor_mouse !== null ? (
            <div>
              <Card>
                <p
                  style={{ margin: "0", fontSize: "16px", fontWeight: "bold" }}
                  className="menu_mode center"
                >
                  Coordonnées : {Math.round(this.state.coor_mouse[0])} -{" "}
                  {Math.round(this.state.coor_mouse[1])}
                </p>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default withCookies(App);
