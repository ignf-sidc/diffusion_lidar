import React, { Component } from 'react';
import {View, Map } from 'ol';
import LayerSwitcher from 'geoportal-extensions-openlayers/src/OpenLayers/Controls/LayerSwitcher';
import {Services, olExtended} from 'geoportal-extensions-openlayers';

import '../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css';
import '../node_modules/ol/ol.css';

class App extends Component {
    render() {
      

          var createMap = function() {
              var map = new Map({
                  target : "map",
                  layers : [
                      new olExtended.layer.GeoportalWMTS({
                          layer : "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"
                      })
                  ],
                  view : new View({
                      center : [288074.8449901076, 6247982.515792289],
                      zoom : 6
                  })
              });

                var search = new olExtended.control.SearchEngine({});
                map.addControl(search);
                
                var layerSwitcher = new olExtended.control.LayerSwitcher({
                  reverse: true,
                  groupSelectStyle: 'group'
                });
                map.addControl(layerSwitcher);

                var attributions = new olExtended.control.GeoportalAttribution();
                map.addControl(attributions);
        }

        Services.getConfig({
            apiKey : "essentiels",
            onSuccess : createMap
         });

        return (

                <div id="map"></div>
        );
    }
}

export default App;