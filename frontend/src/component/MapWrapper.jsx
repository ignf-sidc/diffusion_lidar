import React, { useRef, useEffect } from "react";

import { Services, olExtended as ol } from "geoportal-extensions-openlayers";
import Map from 'ol/Map'
import View from 'ol/View'

function MapWrapper(props) {

  // get ref to div element - OpenLayers will render into this div
  const mapElement = useRef();

  // initialize map on first render - logic formerly put into componentDidMount
  Services.getConfig({
    apiKey: "essentiels",
    onSuccess: go,
  });
  
  function go() {
    new Map({
      target: mapElement.current,
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

  return <div ref={mapElement} className="map-container"></div>;
}

export default MapWrapper;
