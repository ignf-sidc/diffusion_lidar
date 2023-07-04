import * as React from "react";
import { Component } from "react";
import Map from "./Map/Map";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import VectorSource from "ol/source/Vector";

class App extends Component {
  vectorLayerDescribe = {
    source: new VectorSource(),
    style: new Style({
      fill: new Fill({
        color: "rgba(0, 0, 255, 0.1)",
      }),
      stroke: new Stroke({
        color: "black",
        width: 0.5,
      }),
    }),
  };

  render() {
    return (
      <>
        <Map vectorLayerDescribe={this.vectorLayerDescribe}></Map>
      </>
    );
  }
}

export default App;
