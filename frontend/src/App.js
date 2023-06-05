import React, { Component } from 'react';
import { View, Map, Overlay } from 'ol';
import axios from 'axios';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke } from 'ol/style';
import { transform } from 'ol/proj';
import { Select } from 'ol/interaction';

import { Services, olExtended } from 'geoportal-extensions-openlayers';
import '../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css';
import '../node_modules/ol/ol.css';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            coordinate: null,
            showInfobulle: false
        };
        this.vectorSource = new VectorSource();
        this.vectorLayer = new VectorLayer({
            source: this.vectorSource,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(0, 0, 255, 0.1)',
                }),
                stroke: new Stroke({
                    color: 'black',
                    width: 0.5,
                }),
            }),
        });
    }

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
        var createMap = () => {
            var map = new Map({
                target: "map",
                layers: [
                    new olExtended.layer.GeoportalWMTS({
                        layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"
                    }),
                    this.vectorLayer, // Ajout de la couche qui affichera les polygons
                ],
                view: new View({
                    center : [288074.8449901076, 6247982.515792289],
                    zoom: 6,
                })
            });

            var search = new olExtended.control.SearchEngine({});
            map.addControl(search);

            var attributions = new olExtended.control.GeoportalAttribution();
            map.addControl(attributions);

            // Créer une interaction de sélection pour gérer le survol des polygones
            var selectInteraction = new Select({
                condition: function (event) {
                    return event.type === 'pointermove';
                },
                layers: [this.vectorLayer], // Appliquer la sélection uniquement sur la couche vectorielle des polygons
            });

            // évenement au survol d'une salle
            selectInteraction.on('select', function (event) {
                if (event.selected.length > 0) {
                    var selectedFeature = event.selected[0];
                    var coordinate = event.mapBrowserEvent.coordinate;

                    // Afficher les informations de la dalle dans une fenêtre contextuelle (popup)
                    overlay.getElement().innerHTML = 'Coordonnées : ' + coordinate[0] + ', ' + coordinate[1];
                    overlay.setPosition(coordinate);
                    overlay.getElement().style.display = 'block';
                } else {
                    // Si aucun polygon n'est survolé, on cache la popup
                    overlay.getElement().style.display = 'none';
                }
            });

            // Ajout de l'interaction de sélection à la carte
            map.addInteraction(selectInteraction);

            // Lorsque qu'on se déplace sur la carte
            map.on('moveend', () => {

                var view = map.getView();
                // recupere la bbox de la fenetre de son pc
                var extent = view.calculateExtent(map.getSize());

                console.log('extent:', extent);

                // Efface les anciens polygones
                this.vectorSource.clear();

                if (view.getZoom() >= 12) {
                    // Calcule les coordonnées de la bbox
                    var minX = extent[0];
                    var minY = extent[1];
                    var maxX = extent[2];
                    var maxY = extent[3];

                    // taille d'une dalle kilométrique 
                    var tileSize = 1000;

                    // Calcule le nombre de dalles nécessaires en X et en Y
                    var numTilesX = Math.ceil((maxX - minX) / tileSize);
                    var numTilesY = Math.ceil((maxY - minY) / tileSize);

                    // Parcoure sur les dalles et ajout de leurs coordonnées
                    for (var i = 0; i < numTilesX; i++) {
                        for (var j = 0; j < numTilesY; j++) {
                            var tileMinX = minX + i * tileSize;
                            var tileMinY = minY + j * tileSize;
                            var tileMaxX = Math.min(tileMinX + tileSize, maxX);
                            var tileMaxY = Math.min(tileMinY + tileSize, maxY);

                            // Ajout d'une marge aux coordonnées des carrés pour garantir une taille cohérente
                            // var margin = 1; // ajustez la valeur de la marge selon vos besoins
                            // tileMinX += margin;
                            // tileMinY += margin;
                            // tileMaxX -= margin;
                            // tileMaxY -= margin;

                            // Créatipn du polygon pour la dalle
                            var polygon = new Polygon([
                                [
                                    [tileMinX, tileMinY],
                                    [tileMaxX, tileMinY],
                                    [tileMaxX, tileMaxY],
                                    [tileMinX, tileMaxY],
                                    [tileMinX, tileMinY],
                                ],
                            ]);

                            var feature = new Feature({
                                geometry: polygon,
                            });

                            // Ajoutez des polygons à la couche vecteur
                            this.vectorSource.addFeature(feature);
                        }
                    }
                }
            });

            // Créer une couche pour afficher les informations de la dalle survolée
            var overlay = new Overlay({
                element: document.getElementById('popup'),
                autoPan: true,
                autoPanAnimation: {
                    duration: 250,
                },
            });

            // Ajoutez la couche à la carte
            map.addOverlay(overlay);
        }

        Services.getConfig({
            apiKey: "essentiels",
            onSuccess: createMap
        });

        return (
            <div>
                <div id="map"></div>
                <div id="popup" class="ol-popup">
                    <div id="popup-content"></div>
                </div>
            </div>
        );
    }
}

export default App;

