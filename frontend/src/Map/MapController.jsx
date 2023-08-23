import * as React from "react";
import { View, Map } from "ol";
import { Select } from "ol/interaction";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import { Services, olExtended } from "geoportal-extensions-openlayers";
import "../../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../../node_modules/ol/ol.css";
import {
  eventSelectSurvol,
  alert_limit_dalle,
  eventSelectClick,
} from "../component/EventDalle";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Fill, Stroke } from "ol/style";
import MapView from "./MapView";

function MapController({
  zoomStart,
  zoomDisplayDalle,
  tileSize,
  limitDalleSelect,
}) {
  let [lastDalleSelect, setLastDalleSelect] = React.useState();
  let [dallesSelects, setDallesSelects] = React.useState([]);
  let [isLimitDalle, setIsLimitDalle] = React.useState(false);
  let [vectorSourceGridDalle, setVectorSourceGridDalle] = React.useState(
    new VectorSource()
  );
  let vectorSourceDrawPolygon = new VectorSource();
  const vectorLayer = new VectorLayer({
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
  const styleDalle = {
    select: {
      fill: new Fill({
        color: "rgba(112, 119, 122, 0.5)",
      }),
      stroke: new Stroke({
        color: "rgba(112, 119, 122)",
        width: 2,
      }),
    },
    alertLimite: {
      fill: new Fill({
        color: "red",
      }),
      stroke: new Stroke({
        color: "black",
        width: 2,
      }),
    },
  };
  let [map, setMap] = React.useState();

  React.useEffect()={

  }[isLimitDalle]
  
  let eventSelect = (evenType) => {
    // Créer une interaction de sélection pour gérer le survol des polygones
    const selectInteraction = new Select({
      condition: function (event) {
        return event.type === evenType;
      },
      layers: [vectorLayer],
    });

    selectInteraction.on("select", (event) => {
      // évenement au survol d'une salle
      if (evenType == "pointermove") {
        setLastDalleSelect(
          eventSelectSurvol(
            event,
            styleDalle,
            lastDalleSelect,
            dallesSelects,
            limitDalleSelect
          )
        );
      }

      // évenement au click d'une dalle
      if (evenType == "click") {
        setDallesSelects(eventSelectClick(event, dallesSelects, styleDalle));
        setIsLimitDalle(
          alert_limit_dalle(
            styleDalle,
            vectorSourceGridDalle,
            limitDalleSelect,
            dallesSelects,
            isLimitDalleSelect
          )
        );
      }
    });

    return selectInteraction;
  };

  // Lorsque qu'on se déplace sur la carte
  let mooveMap = () => {
    if (map) {
      const view = map.getView();

      // recupere la bbox de la fenetre de son pc
      const extent = view.calculateExtent(map.getSize());

      // Efface les anciens polygones
      vectorSourceGridDalle.clear();

      if (view.getZoom() >= zoomDisplayDalle) {
        // Calcule les coordonnées de la bbox
        const minX = extent[0];
        const minY = extent[1];
        const maxX = extent[2];
        const maxY = extent[3];

        // Calcule le nombre de dalles nécessaires en X et en Y
        const numTilesX = Math.ceil((maxX - minX) / tileSize);
        const numTilesY = Math.ceil((maxY - minY) / tileSize);

        // Parcour sur les dalles et ajout de leurs coordonnées
        for (let i = 0; i < numTilesX; i++) {
          for (let j = 0; j < numTilesY; j++) {
            let tileMinX = minX + i * tileSize;
            let tileMinY = minY + j * tileSize;
            let tileMaxX = Math.min(tileMinX + tileSize, maxX);
            let tileMaxY = Math.min(tileMinY + tileSize, maxY);

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
            dallesSelects.forEach((dalleSelect) => {
              if (dalleSelect["values_"]["properties"]["id"] === polygonId) {
                if (isLimitDalle === true) {
                  feature.setStyle(new Style(styleDalle.alertLimite));
                } else {
                  feature.setStyle(new Style(styleDalle.select));
                }
              }
            });

            // Ajoutez des polygons à la couche vecteur
            vectorSourceGridDalle.addFeature(feature);
          }
        }
      }
    }
  };

  let componentDidMount = () => {
    const createMap = () => {
      // creation du canvas de la carte
      let mapy = new Map({
        target: "map",
        layers: [
          new olExtended.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
          }),
          vectorLayer, // Ajout de la couche qui affichera les polygons
          drawnPolygonsLayer, // ajout de la couche qui affichera le polygon pour séléctionner des dalles
        ],
        view: new View({
          center: [288074.8449901076, 6247982.515792289],
          zoom: zoomStart,
        }),
      });

      // ajout d'un motuer de recherche à la carte
      mapy.addControl(new olExtended.control.SearchEngine({ zoomTo: 12 }));

      // ajout d'un selecteur de couches
      mapy.addControl(
        new olExtended.control.LayerSwitcher({
          reverse: true,
          groupSelectStyle: "group",
        })
      );

      //ajout des crédits
      mapy.addControl(new olExtended.control.GeoportalAttribution());

      // ajout de la méthode au mouvement sur la carte
      mapy.on("moveend", () => {
        mooveMap();
      });

      // ajout des interaction au clicke et au survol sur la carte
      mapy.addInteraction(eventSelect("pointermove"));
      mapy.addInteraction(eventSelect("click"));

      setMap(mapy);
    };

    Services.getConfig({
      apiKey: "essentiels",
      onSuccess: createMap,
    });
  };

  return (
    <>
      {componentDidMount()}
      <MapView />
    </>
  );
}

export default MapController;
