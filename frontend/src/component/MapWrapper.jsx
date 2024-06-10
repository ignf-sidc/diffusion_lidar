import React, {  useContext, useEffect} from "react";
import { MapContext } from "../App.jsx";

// import ol
import { Services, olExtended as ol } from "geoportal-extensions-openlayers";
import Map from 'ol/Map'
import View from 'ol/View'
import { Select, Draw } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import { Overlay } from "ol";
import VectorSource from "ol/source/Vector";
import { Style, Fill, Stroke } from "ol/style";
import { createBox, createRegularPolygon } from "ol/interaction/Draw.js";

import { get as getProjection } from "ol/proj";


// import component

import { get_bloc, get_dalles } from "../hook/useUtils";
import { handle_mode_change } from "../hook/useHandle.js";

// init const
const overlay = new Overlay({
  element: document.getElementById("popup"),
  autoPan: false,
  autoPanAnimation: {
    duration: 250,
  },
});
const vectorSourceBloc = new VectorSource();

const drawnBlocsLayer = new VectorLayer({
  source: vectorSourceBloc,
});

const selectInteractionBloc = new Select({
  condition: function (event) {
    return event.type === "pointermove";
  },
  layers: [drawnBlocsLayer],
});

const zoomToClickBloc = new Select({
  condition: function (event) {
    return event.type === "click";
  },
  layers: [drawnBlocsLayer],
});


const onFailure = (error) => {
  // Gestion de l'échec ici
  console.error(
    "Erreur lors de la récupération de la configuration :",
    error
  );
};


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


zoomToClickBloc.on("select", (event) => {
  zoom_to_polygon(event.selected[0], 11, ref);
  overlay.getElement().style.display = "none";
});

const map = new Map({
  target: null,
  layers: [
  ],
  view: new View({
    projection: getProjection("EPSG:2154"),
    center: [
      288074.8449901076, 6247982.515792289,
    ],
    zoom: 5,
    maxZoom: 16,
  }),
});



function MapWrapper({ }, ref) {




  const {
    MapState,
    setMapState,
    vectorSourceGridDalle,
    dalleLayer,
    style_dalle,
    selectedMode,
  } = useContext(MapContext);

  const selectInteractionClick = new Select({
    condition: function (event) {
      return event.type === "click";
    },
    layers: [dalleLayer],
  });

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

  
  useEffect(()=>{if (selectedMode == "polygon") {
    console.log(ref);
    map.removeInteraction(selectInteractionClick);
    map.addInteraction(drawPolygon);
    map.removeInteraction(drawRectangle);
  } else if (selectedMode == "rectangle") {
    map.removeInteraction(selectInteractionClick);
    map.removeInteraction(drawPolygon);
    map.addInteraction(drawRectangle);
  } else if (selectedMode == "click") {
    map.addInteraction(selectInteractionClick);
    map.removeInteraction(drawPolygon);
    map.removeInteraction(drawRectangle);
  }
  },[selectedMode])



  // initialize map on first render - logic formerly put into componentDidMount
  Services.getConfig({
    apiKey: "essentiels",
    onSuccess: go,
    onFailure
  });

  function go(map) {
    map = new Map({
      target: ref.current,
      layers: [
        new ol.layer.GeoportalWMTS({
          layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
        }),
      ],
      view: new View({
        projection: getProjection("EPSG:2154"),
        center: [
          288074.8449901076, 6247982.515792289,
        ],
        zoom: 5,
        maxZoom: 16,
      }),
    });
    map.addOverlay(overlay);
    map.on("moveend", () => {
      const view = map.getView();
      setMapState({...MapState, zoom: view.getZoom()});

      // recupere la bbox de la fenetre de son pc
      const extent = view.calculateExtent(map.getSize());

      // Efface les anciens polygones et blocs
      vectorSourceGridDalle.clear();
      drawnBlocsLayer.getSource().clear();

      if (view.getZoom() >= 6) {
        // Calcule les coordonnées de la bbox
        const minX = extent[0];
        const minY = extent[1];
        const maxX = extent[2];
        const maxY = extent[3];


        const url = `https://data.geopf.fr/private/wfs/?service=WFS&version=2.0.0&apikey=interface_catalogue&request=GetFeature&typeNames=ta_lidar-hd:dalle&outputFormat=application/json&bbox=${minX},${minY},${maxX},${maxY}`

        get_dalles(url,MapState.dalles_select,vectorSourceGridDalle,style_dalle)
      } else {
        setMapState({
          ...MapState,
          selectedMode: handle_mode_change(
            { target: { value: "click" } },
            ref,
            MapState.selectedMode,
            selectInteractionClick,
            drawPolygon,
            drawRectangle
          ),
        });
        get_bloc(drawnBlocsLayer, vectorSourceBloc);
      }
    });

  map.addInteraction(selectInteractionClick)
  }

  return <div className="map-container">
    <div ref={ref} id="map"></div>
    <div id="popup" className="ol-popup">
      <div id="popup-content"></div>
    </div></div>;

}

export default React.forwardRef(MapWrapper);
