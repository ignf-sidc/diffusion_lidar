import * as React from "react";
import { Component } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import "../../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../../node_modules/ol/ol.css";
import { MapController } from "./MapController";
import { Style, Fill, Stroke } from "ol/style";

class Map extends Component {


  state = {
    mapInstance: null,
    zoom: 5,
    zoom_display_dalle: 11,
    tileSize: 1000,
    
    old_dalles_select: null,
    dalles_select: [],
    limit_dalle: false,
    limit_dalle_select: 5,
  }

  constructor(style_dalle) {
    super();
    this.style_dalle = style_dalle
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
    this.MapController = new MapController(
      this.state,
      this.setState,
      this.vectorLayer,
      this.drawnPolygonsLayer,
      this.vectorSourceGridDalle,
      this.style_dalle
    );
  }

  render() {
    this.MapController.componentDidMount();
    return (
      <>
        <div className="map-container">
          <div id="map"></div>
          <div id="popup" className="ol-popup">
            <div id="popup-content"></div>
          </div>
        </div>
      </>
    );
  }
}

export default Map;
