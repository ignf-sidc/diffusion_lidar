import React, { useRef, useEffect } from "react";

import { Services, olExtended as ol } from "geoportal-extensions-openlayers";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
// import VectorLayer from 'ol/layer/Vector'
// import VectorSource from 'ol/source/Vector'
//import XYZ from 'ol/source/XYZ'

function MapWrapper(props) {
  // set intial state - used to track references to OpenLayers
  // //  objects for use in hooks, event handlers, etc.
  // const [ map, setMap ] = useState()
  // const [ featuresLayer, setFeaturesLayer ] = useState()
  //const [ selectedCoord , setSelectedCoord ] = useState()

  // get ref to div element - OpenLayers will render into this div
  const mapElement = useRef();

  // state and ref setting logic eliminated for brevity
  // initialize map on first render - logic formerly put into componentDidMount
  useEffect(() => {
    Services.getConfig({ apiKey: "cartes", onSuccess: go });

    // create and add vector source layer
  }, []);

  function go() {
    // create map
    new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
  }

  /*{
      target: mapElement.current,
      layers: [
        
        // USGS Topo
        new TileLayer({
          source: new XYZ({
            url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
          })
        }),

        initalFeaturesLayer
        
      ],
      view: new View({
        projection: 'EPSG:3857',
        center: [0, 0],
        zoom: 2
      }),
      controls: []
    })*/

  // save map and vector layer references to state
  // setMap(initialMap)
  // setFeaturesLayer(initalFeaturesLayer)

  return <div ref={mapElement} className="map-container"></div>;
}

export default MapWrapper;
