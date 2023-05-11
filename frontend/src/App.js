import React, { Component } from 'react';
import {View, Map } from 'ol';
import axios from 'axios';

import {Services, olExtended} from 'geoportal-extensions-openlayers';

import '../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css';
import '../node_modules/ol/ol.css';

class App extends Component {
    componentDidMount() {
        axios.get(`http://${process.env.REACT_APP_HOST_API}:8000/hello_world`)
          .then(response => {
            console.log(response.data);
          })
          .catch(error => {
            console.error(error);
          });
      }
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