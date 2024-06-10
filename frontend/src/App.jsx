// react lib
import React, { useState, useRef, createContext } from "react";

// ol lib
import "../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../node_modules/ol/ol.css";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Fill, Stroke } from "ol/style";
import { Select, Draw } from "ol/interaction";
import { createBox } from "ol/interaction/Draw.js";

// component made hom
import MapWrapper from "./component/MapWrapper";
import Menu from "./component/Menu/Menu";

export const MapContext = createContext()

function App() {

  const [MapState, setMapState] = useState({
    showInfobulle: false,
    coordinate_mouse: null,
    zoom: 5,
    coordinate: [
      288074.8449901076, 6247982.515792289,
    ],
    fileUpload: [],
  });

  const [dalleState, setDalleState] = useState({
    dalles_select: [],
    selectedDalles: [],
    old_dalles_select: null

  })

  const [polygonState, setPolygonState] = useState({
    polygon_drawn: [],
    polygon_select_list_dalle: { polygon: null, dalles: [] },
    polygon_drawn: [],
  })

  const [selectedMode, setSelectedMode] = useState("click");
  const [api_url, setApi_url] = useState();
  const name_file_txt = "liste_dalle.txt";
  const limit_dalle_select = 2500;
  const style_dalle = {
    select: {
      fill: new Fill({
        color: "rgba(112, 119, 122, 0.5)",
      }),
      stroke: new Stroke({
        color: "rgba(112, 119, 122)",
        width: 2,
      }),
    },
    pointer_move_dalle_menu: {
      fill: new Fill({
        color: "yellow",
      }),
      stroke: new Stroke({
        color: "black",
        width: 2,
      }),
    }
  }
  let vectorSourceDrawPolygon = new VectorSource();
  let vectorSourceFilePolygon = new VectorSource();
  const vectorSourceGridDalle = new VectorSource();
  const dalleLayer = new VectorLayer({
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


  





  const mapElement = useRef();
  return (<MapContext.Provider
    value={{
      MapState,
      setMapState,
      vectorSourceGridDalle,
      selectedMode,
      setSelectedMode,
      style_dalle,
      dalleState,
    }}
  >
    <MapWrapper ref={mapElement}></MapWrapper>

  </MapContext.Provider>)
}


export default App;