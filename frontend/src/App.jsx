import * as React from "react";
import { Component } from "react";
import Map from "./Map/Map";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import VectorSource from "ol/source/Vector";

class App extends Component {

  style_dalle = {
    "select": {
        fill: new Fill({
            color: 'rgba(112, 119, 122, 0.5)',
        }),
        stroke: new Stroke({
            color: 'rgba(112, 119, 122)',
            width: 2,
        }),
    },
    "alert_limite": {
        fill: new Fill({
            color: "red",
        }),
        stroke: new Stroke({
            color: 'black',
            width: 2,
        }),
    }
}
  

  render() {
    return (
      <>
        <Map style_dalle={this.style_dalle}></Map>
      </>
    );
  }
}

export default App;
