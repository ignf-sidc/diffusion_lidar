import * as React from "react";
import { Component } from "react";
import { View, Map} from "ol";
import { Select, Draw } from "ol/interaction";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import { Services, olExtended } from "geoportal-extensions-openlayers";
import "../../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../../node_modules/ol/ol.css";
import eventSelectSurvol from "../component/EventDalle";

export class MapController extends Component {
  constructor(
    state,
    vectorLayer,
    drawnPolygonsLayer,
    vectorSourceGridDalle,
    style_dalle
  ) {
    super({});
    this.state = state;
    this.vectorLayer = vectorLayer;
    this.drawnPolygonsLayer = drawnPolygonsLayer;
    this.vectorSourceGridDalle = vectorSourceGridDalle;
    this.style_dalle = style_dalle;
    this.map = null;
  }

  eventSelect(evenType) {
    // Créer une interaction de sélection pour gérer le survol des polygones
    const selectInteraction = new Select({
      condition: function (event) {
        return event.type === evenType;
      },
      layers: [this.vectorLayer],
    });

    // évenement au survol d'une salle
    selectInteraction.on("select", (event) => {
      console.log(evenType);
      if (evenType == "pointermove") {
        this.setState(
          eventSelectSurvol(
            event,
            this.style_dalle,
            this.state.old_dalles_select,
            this.state.dalles_select,
            this.state.alert_limit_dalle_state
          )
        );
      }
    });

    return selectInteraction;
  }

  componentDidMount() {
    const createMap = () => {
      this.map = new Map({
        target: "map",
        layers: [
          new olExtended.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
          }),
          this.vectorLayer, // Ajout de la couche qui affichera les polygons
          this.drawnPolygonsLayer, // ajout de la couche qui affichera le polygon pour séléctionner des dalles
        ],
        view: new View({
          center: [288074.8449901076, 6247982.515792289],
          zoom: 6,
        }),
      });
      this.setState({ mapInstance: map });
      var search = new olExtended.control.SearchEngine({ zoomTo: 12 });
      this.map.addControl(search);

      const layerSwitcher = new olExtended.control.LayerSwitcher({
        reverse: true,
        groupSelectStyle: "group",
      });
      this.map.addControl(layerSwitcher);
      const attributions = new olExtended.control.GeoportalAttribution();
      this.map.addControl(attributions);
      this.map.on("moveend", () => {
        this.mooveMap();
      });


      const selectInteraction = this.eventSelect(
        "pointermove"
      );

      console.log(selectInteraction);

      this.map.addInteraction(selectInteraction);
    };

    Services.getConfig({
      apiKey: "essentiels",
      onSuccess: createMap,
    });
  }

  // Lorsque qu'on se déplace sur la carte
  mooveMap = () => {
    const view = this.map.getView();
    this.setState({ zoom: view.getZoom() });

    // recupere la bbox de la fenetre de son pc
    const extent = view.calculateExtent(this.map.getSize());

    // Efface les anciens polygones
    this.vectorSourceGridDalle.clear();

    if (view.getZoom() >= this.state.zoom_display_dalle) {
      // Calcule les coordonnées de la bbox
      const minX = extent[0];
      const minY = extent[1];
      const maxX = extent[2];
      const maxY = extent[3];

      // Calcule le nombre de dalles nécessaires en X et en Y
      const numTilesX = Math.ceil((maxX - minX) / this.state.tileSize);
      const numTilesY = Math.ceil((maxY - minY) / this.state.tileSize);

      // Parcour sur les dalles et ajout de leurs coordonnées
      for (let i = 0; i < numTilesX; i++) {
        for (let j = 0; j < numTilesY; j++) {
          let tileMinX = minX + i * this.state.tileSize;
          let tileMinY = minY + j * this.state.tileSize;
          let tileMaxX = Math.min(tileMinX + this.state.tileSize, maxX);
          let tileMaxY = Math.min(tileMinY + this.state.tileSize, maxY);

          // Arrondir les coordonnées aux nombres ronds
          tileMinX = Math.round(tileMinX / 1000) * 1000;
          tileMinY = Math.round(tileMinY / 1000) * 1000;
          tileMaxX = Math.round(tileMaxX / 1000) * 1000;
          tileMaxY = Math.round(tileMaxY / 1000) * 1000;

          // Créatipn du polygon pour la dalle
          const polygon = new Polygon([
            [
              [tileMinX, tileMinY],
              [tileMaxX, tileMinY],
              [tileMaxX, tileMaxY],
              [tileMinX, tileMaxY],
              [tileMinX, tileMinY],
            ],
          ]);

          // nom de la dalle
          const polygonId = "dalle-" + tileMaxX + "-" + tileMinY;

          const feature = new Feature({
            geometry: polygon,
            properties: {
              id: polygonId,
            },
          });
          // quand on bouge la carte on met le style de dalle selectionner si c'est le cas
          // this.dalles_select.forEach(dalle_select => {
          //     if (dalle_select["values_"]["properties"]["id"] === polygonId) {
          //         if (this.alert_limit_dalle_state === true) {
          //             feature.setStyle(new Style(this.style_dalle.alert_limite))
          //         } else {
          //             feature.setStyle(new Style(this.style_dalle.select))
          //         }

          //     }
          // });

          // Ajoutez des polygons à la couche vecteur
          this.vectorSourceGridDalle.addFeature(feature);
        }
      }
    }
  };
}
