import React, { Component } from 'react';
import { View, Map, Overlay } from 'ol';
import axios from 'axios';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke } from 'ol/style';
import { Select } from 'ol/interaction';
import { Services, olExtended } from 'geoportal-extensions-openlayers';
import '../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css';
import '../node_modules/ol/ol.css';
import { FaTimes } from 'react-icons/fa';


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            coordinate: null,
            showInfobulle: false,
            selectedFeatures: [],
            dalles_select: []
        };
        this.dalles_select = []
        this.old_dalles_select = null
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
        this.style_dalle = {
            "select": {
                fill: new Fill({
                    color: 'rgba(112, 119, 122, 0.5)',
                }),
                stroke: new Stroke({
                    color: 'rgba(112, 119, 122)',
                    width: 2,
                }),
            }
        }
    }

    style_dalle_select(feature) {
        // fonction permettant d'ajuster le style au survol d'une dalle
        // on parcout la liste des dalles selectionner
        for (const dalle_select of this.dalles_select) {
            // si la dalle est selectionner alors au survol on lui laisse le style select et on retourne true
            if (dalle_select["values_"]["properties"]["id"] === feature["values_"]["properties"]["id"]) {
                feature.setStyle(new Style(this.style_dalle.select))
                return true
            }
        };
        // si la dalle n'est pas dans la liste on retourne false
        return false
    }

    remove_dalle_menu = (index, dalle_remove) => {
        // fonction qui permet de déselectionner une dalle et de remettre son style à jours

        // on parcourt la liste des dalles et non celle des dalles selectionner car quand la carte bouge une nouvelle dalle est creer
        // et donc il nous faut recuperer la dalle actuel et non l'ancienne qui certes est au meme endroit mais a des propriétés différentes
        this.vectorSource.getFeatures().forEach((feature) => {
            // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
            if (feature.values_.properties.id === dalle_remove.values_.properties.id) {
                feature.setStyle(null);
            }
        });
        // on supprime la dalle de la liste
        this.dalles_select.splice(index, 1);

        this.setState({ dalles_select: this.dalles_select });   
    };

    componentDidMount() {
        axios.get(`http://${process.env.REACT_APP_HOST_API}:8000/hello_world`)
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });

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
                    center: [288074.8449901076, 6247982.515792289],
                    zoom: 6,
                })
            });

            var search = new olExtended.control.SearchEngine({ zoomTo: 12 });
            map.addControl(search);

            var layerSwitcher = new olExtended.control.LayerSwitcher({
                reverse: true,
                groupSelectStyle: 'group'
            });
            map.addControl(layerSwitcher);
            var attributions = new olExtended.control.GeoportalAttribution();
            map.addControl(attributions);


            // Créer une interaction de sélection pour gérer le survol des polygones
            var selectInteraction = new Select({
                condition: function (event) {
                    return event.type === 'pointermove';
                },
                layers: [this.vectorLayer],
            });

            // évenement au survol d'une salle
            selectInteraction.on('select', (event) => {
                if (event.selected.length > 0) {
                    var selectedFeature = event.selected[0];
                    var coordinate = event.mapBrowserEvent.coordinate;

                    // Afficher les informations de la dalle dans une fenêtre contextuelle (popup)
                    overlay.getElement().innerHTML = selectedFeature["values_"]["properties"]["id"]
                    overlay.setPosition(coordinate);
                    overlay.getElement().style.display = 'block';
                    // quand on survole une dalle cliquer on met le style d'une dalle cliquer
                    this.style_dalle_select(selectedFeature)
                }
                // quand on quitte la dalle survolé
                if (event.deselected.length > 0) {
                    if (this.old_dalles_select !== null) {
                        var selected = this.style_dalle_select(this.old_dalles_select)
                        if (!selected){
                            // si on survol une dalle non cliqué alors on remet le style null
                            this.old_dalles_select.setStyle(null);
                        }
                    }
                }
                // on stocke la derniere dalle survoler pour modifier le style
                this.old_dalles_select = selectedFeature
            });


            var selectInteractionClick = new Select({
                condition: function (event) {
                    return event.type === 'click';
                },
                layers: [this.vectorLayer],
            });

            // évenement au click d'une salle
            selectInteractionClick.on('select', (event) => {
                if (event.selected.length > 0) {
                    const featureSelect = event.selected[0];

                    if (this.dalles_select.length === 0) {
                        // au clique sur une dalle pas selectionner on l'ajoute à la liste
                        
                        featureSelect.setStyle(new Style(this.style_dalle.select))
                        this.dalles_select.push(featureSelect);
                        console.log(featureSelect);
                    } else {
                        this.dalles_select.forEach((dalle_select, index) => {
                            if (dalle_select["values_"]["properties"]["id"] === featureSelect["values_"]["properties"]["id"]) {
                                // au clique sur une dalle déjà selectionner on la supprime
                                console.log(featureSelect);
                                this.dalles_select.splice(index, 1);
                                featureSelect.setStyle(null);
                            } else {
                                // on verifie que la dalle n'est pas déjà dans la liste pour eviter des doublons 
                                if (this.dalles_select.indexOf(featureSelect) == -1) {
                                    // au clique sur une dalle pas selectionner on l'ajoute à la liste
                                    featureSelect.setStyle(new Style(this.style_dalle.select))
                                    this.dalles_select.push(featureSelect);
                                }

                            }
                        });
                    }

                    overlay.getElement().style.display = 'none';
                }
                // au click d'une dalle, on regarde la dalle qu'on a cliquer juste avant pour lui assigner un style
                // si la dalle qu'on a cliquer avant est dans la liste des dalles selectionner alors on lui ajoute le style d'une dalle selectionner
                if (event.deselected.length > 0) {
                    const featureDeselect = event.deselected[0];
                    if (this.dalles_select.indexOf(event.deselected[0]) > -1) {
                        featureDeselect.setStyle(new Style(this.style_dalle.select))
                    } else {
                        featureDeselect.setStyle(null);
                    }

                }
                this.setState({ dalles_select: this.dalles_select });
            });


            // Ajout de l'interaction de sélection à la carte
            map.addInteraction(selectInteractionClick);
            map.addInteraction(selectInteraction);


            // Lorsque qu'on se déplace sur la carte
            map.on('moveend', () => {

                var view = map.getView();
                // recupere la bbox de la fenetre de son pc
                var extent = view.calculateExtent(map.getSize());

                // Efface les anciens polygones
                this.vectorSource.clear();

                if (view.getZoom() >= 11) {
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

                            // Arrondir les coordonnées aux nombres ronds
                            var tileMinX = Math.round(tileMinX / 1000) * 1000;
                            var tileMinY = Math.round(tileMinY / 1000) * 1000;
                            var tileMaxX = Math.round(tileMaxX / 1000) * 1000;
                            var tileMaxY = Math.round(tileMaxY / 1000) * 1000;

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
                            
                            // nom de la dalle
                            var polygonId = 'dalle-' + tileMaxX + '-' + tileMinY;

                            // Vérifiez si le polygone est sélectionné et appliquez le style approprié
                            // var isSelected = this.state.selectedFeatures.some((feature) => feature.getGeometry().getId() === polygon.getId());


                            var feature = new Feature({
                                geometry: polygon,
                                properties: {
                                    id: polygonId,
                                },
                            });
                            // quand on bouge la carte on met le style de dalle selectionner si c'est le cas
                            this.dalles_select.forEach(dalle_select => {
                                if (dalle_select["values_"]["properties"]["id"] === polygonId) {
                                    feature.setStyle(new Style(this.style_dalle.select))
                                }
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
    }

    render() {
        return (
            <div>
                <div className="map-container">
                    <div id="map"></div>
                    <div id="popup" className="ol-popup">
                        <div id="popup-content"></div>
                    </div>
                </div>

                <div className="menu">
                    <div className="dalle-select">
                        <h4 className="mt-4">Données classifié Lidar&nbsp;HD</h4>
                        {this.state.dalles_select.length === 0 ? (
                            <p>Aucune donnée séléctionnées.</p>
                        ) : (
                            <React.Fragment>
                                <h5>Affichage des dalles sélectionnées</h5>
                                <p>Nombre de dalles séléctionnées : {this.state.dalles_select.length}/50</p>
                                {this.state.dalles_select.map((item, index) => (
                                    <div className="liste_dalle" key={index}>
                                        <button onClick={() => this.remove_dalle_menu(index, item)}><FaTimes style={{ color: 'red' }}/></button>
                                        <p>{item.values_.properties.id}</p>
                                    </div>
                                ))}
                            </React.Fragment>

                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default App;

