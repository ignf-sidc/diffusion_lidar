import * as React from "react";
import { Component } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { View, Map } from "ol";
import { Services, olExtended } from "geoportal-extensions-openlayers";
import "../../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../../node_modules/ol/ol.css";

export class MapController extends Component {

  constructor(
    state,
    vectorLayer,
    drawnPolygonsLayer
  ) {
    super({});
    this.state = state;
    this.vectorLayer = vectorLayer;
    this.drawnPolygonsLayer = drawnPolygonsLayer;
  }

  componentDidMount() {

    const createMap = (
    ) => {

      
      
      var map = new Map({
        target: "map",
        layers: [
          new olExtended.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
          }),
          this.vectorLayer, // Ajout de la couche qui affichera les polygons
          this.drawnPolygonsLayer, // ajout de la couche qui affichera le polygon pour séléectionner des dalles
        ],
        view: new View({
          center: [288074.8449901076, 6247982.515792289],
          zoom: 6,
        }),
      });
      this.setState({ mapInstance: map });
      var search = new olExtended.control.SearchEngine({ zoomTo: 12 });
      map.addControl(search);
  
      var layerSwitcher = new olExtended.control.LayerSwitcher({
        reverse: true,
        groupSelectStyle: "group",
      });
      map.addControl(layerSwitcher);
      var attributions = new olExtended.control.GeoportalAttribution();
      map.addControl(attributions);
    };
    console.log('hello');

    
    Services.getConfig({
      apiKey: "essentiels",
      onSuccess: createMap,
    });
  }

}
