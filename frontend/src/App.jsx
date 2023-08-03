import * as React from "react";
import { Component } from "react";
import Map from "./Map/Map";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import VectorSource from "ol/source/Vector";

class App extends Component {
  

  render() {
    return (
      <>
        <Map></Map>
      </>
    );
  }
}

export default App;
