import React, { useRef, useEffect } from "react";

import { Services, olExtended as ol } from "geoportal-extensions-openlayers";
import Map from 'ol/Map'
import View from 'ol/View'

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
    Services.getConfig({
      apiKey: "essentiels",
      onSuccess: go,
    });

    // create and add vector source layer
  }, []);
  function go() {
    var map = new Map({
      target: "map",
      layers: [
        new ol.layer.GeoportalWMTS({
          layer: "ORTHOIMAGERY.ORTHOPHOTOS",
        }),
      ],
      view: new View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12,
      }),
    });
  }

  return <div ref={mapElement} className="map-container" id="map"></div>;
}

export default MapWrapper;
