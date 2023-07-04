import * as React from "react";
import { Component } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import "../../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../../node_modules/ol/ol.css";
import { MapController } from "./MapController";
import { Services } from "geoportal-extensions-openlayers";
import { Geometry } from "ol/geom";
import { Options } from "ol/layer/BaseVector";


class Map extends Component{

  constructor(vectorLayerDescribe) {
    super(vectorLayerDescribe);
    this.vectorSourceGridDalle = new VectorSource();
    this.vectorSourceDrawPolygon = new VectorSource();
    this.vectorLayer = new VectorLayer(vectorLayerDescribe.vectorLayerDescribe);
    this.drawnPolygonsLayer = new VectorLayer({
      source: this.vectorSourceDrawPolygon,
    });
    this.state = {
      mapInstance: null,
      zoom: 5,
    };
    this.MapController = new MapController(this.state,this.vectorLayer, this.drawnPolygonsLayer);
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
