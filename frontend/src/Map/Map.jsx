import * as React from "react";
import { Component } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import "../../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../../node_modules/ol/ol.css";
import { MapController } from "./MapController";
import { Style, Fill, Stroke } from 'ol/style';



class Map extends Component{

  constructor() {
    super()
    this.vectorSourceGridDalle = new VectorSource();
    this.vectorSourceDrawPolygon = new VectorSource();
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
    this.state = {
      mapInstance: null,
      zoom: 5,
      zoom_display_dalle: 11,
      tileSize : 1000
    };
    this.MapController = new MapController(this.state,this.vectorLayer, this.drawnPolygonsLayer,this.vectorSourceGridDalle);
  }
  
  render() {
    this.MapController.componentDidMount()
    return (
      <>
        <div className="map-container">
          <div id="map"></div>
        </div>
      </>
    );
  }
}

export default Map;
