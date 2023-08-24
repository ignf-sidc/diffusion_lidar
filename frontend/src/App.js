import React, { Component } from 'react';
import { View, Map } from 'ol';
import axios from 'axios';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke } from 'ol/style';
import { Select, Draw } from 'ol/interaction';
import {createBox, createRegularPolygon,} from 'ol/interaction/Draw.js';
import { Services, olExtended } from 'geoportal-extensions-openlayers';
import '../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css';
import '../node_modules/ol/ol.css';
import { FaTimes, FaMapMarker } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { BsChevronDown, BsChevronLeft } from 'react-icons/bs';
import { withCookies } from 'react-cookie';
import { Card, Radio, Space } from 'antd';


class App extends Component {
    constructor(props) {
        super(props);
        const { cookies } = props;
        this.state = {
            coordinate: null,
            showInfobulle: false,
            selectedFeatures: [],
            dalles_select: [],
            polygon_drawn: [],
            mapInstance: null,
            polygon_select_list_dalle: { "polygon": null, "dalles": [] },
            selectedMode: 'click',
            zoom: 5,
            coor_mouse: null,
            expiresDateCookie: null,
            cookie_zoom_start: cookies.get('zoom') || 6, 
            cookie_coor_start: cookies.get('coor') || [288074.8449901076, 6247982.515792289]
        };
        this.day_cookie_expiration = 7
        this.dalles_select = []
        this.polygon_drawn = []
        this.limit_dalle_select = 5
        this.alert_limit_dalle_state = false
        this.old_dalles_select = null
        this.selectInteractionClick = null
        this.drawPolygon = null
        this.drawRectangle = null
        this.zoom_dispaly_dalle = 11
        this.vectorSourceGridDalle = new VectorSource();
        this.vectorSourceDrawPolygon = new VectorSource();
        this.vectorLayer = new VectorLayer({
            source: this.vectorSourceGridDalle,
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
        this.drawnPolygonsLayer = new VectorLayer({
            source: this.vectorSourceDrawPolygon,
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
            },
            "alert_limite": {
                fill: new Fill({
                    color: "red",
                }),
                stroke: new Stroke({
                    color: 'black',
                    width: 2,
                }),
            },
            "pointer_move_dalle_menu": {
                fill: new Fill({
                    color: "yellow",
                }),
                stroke: new Stroke({
                    color: 'black',
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
                if (this.alert_limit_dalle_state === true) {
                    feature.setStyle(new Style(this.style_dalle.alert_limite))
                } else {
                    feature.setStyle(new Style(this.style_dalle.select))
                }

                return true
            }
        };
        // si la dalle n'est pas dans la liste on retourne false
        return false
    }

    remove_dalle_in_polygon(polygon) {
        // fonction qui surpprime toutes les dalles d'un polygon supprimer
        // liste qui va nous permettre de stocker les dalles qu'on veut supprimer
        var liste_dalle_remove = []
        // on boucle sur toutes les dalles selctionner
        this.dalles_select.forEach(dalle => {
            // si les dalles appartiennent au polygon alors on les ajouter à la liste liste_dalle_remove
            if (dalle.values_.properties.polygon === polygon.values_.id) {
                liste_dalle_remove.push(dalle)
                // on filtre sur les polygons pour recuperer ceux qui sont dans le polygon et enlever leur style select pour remettre celui de base
                this.vectorSourceGridDalle.getFeatures().filter((feature) => {
                    if (feature.values_.properties.id == dalle.values_.properties.id) {
                        feature.setStyle(null)
                    }
                });
            }
        });
        // on récupere la difference entre la liste ou on stocke les dalles qu'on veut supprimer et celle qui contient
        // toutes les dalles selectionner pour ne recuperer que les dalles en dehors du polygon supprimer
        this.dalles_select = this.dalles_select.filter((element) => !liste_dalle_remove.includes(element));
        console.log(111);
    }

    remove_dalle_menu = (index, dalle_remove, polygon=null) => {
        // fonction qui permet de déselectionner une dalle et de remettre son style à jours
        if (index === null) {
            index = this.dalles_select.indexOf(dalle_remove)
        }
        // on parcourt la liste des dalles et non celle des dalles selectionner car quand la carte bouge une nouvelle dalle est creer
        // et donc il nous faut recuperer la dalle actuel et non l'ancienne qui certes est au meme endroit mais a des propriétés différentes
        this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
            // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
            if (feature.values_.properties.id === dalle_remove.values_.properties.id) {
                feature.setStyle(null);
            }
        });
        // on supprime la dalle de la liste
        this.dalles_select.splice(index, 1);

        this.setState({ dalles_select: this.dalles_select });
        this.alert_limit_dalle()
        if (polygon != null) {
            this.list_dalle_in_polygon(polygon, "open")
        }else{
            this.list_dalle_in_polygon(polygon, "close")
        }
    };

    remove_polygon_menu = (polygon_remove) => {
        // fonction qui permet de supprimer un polygon 

        // on parcourt la liste des polygons et on surppimer le polygon en question du layer
        this.drawnPolygonsLayer.getSource().getFeatures().forEach((feature) => {
            // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
            if (feature.values_.id === polygon_remove.values_.id) {
                // Supprimer la fonctionnalité du source du layer
                this.vectorSourceDrawPolygon.removeFeature(feature);
            }
            // on lance la fonction qui supprime les dalles du polygons supprimer
            this.remove_dalle_in_polygon(polygon_remove)
        });


        this.setState({ dalles_select: this.dalles_select });
        this.setState({ polygon_drawn: this.drawnPolygonsLayer });
        this.alert_limit_dalle()
    };

    remove_all_dalle_menu = () => {
        // fonction lancer pour supprimer toutes les dalles
        // on parcourt la liste des dalles dans la fenetre pour remettre leur design de base
        this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
            // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
            if (feature.getStyle() !== null) {
                feature.setStyle(null);
            }
        });
        // on remet la liste des dalles selectionner à 0
        this.dalles_select = []
        this.setState({ dalles_select: this.dalles_select });
        // il n'y a pu de dalle, les polygons n'ont donc pu de dalle dans leurs emprises, on peut donc les supprimer
        this.drawnPolygonsLayer.getSource().clear();
        this.setState({ polygon_drawn: this.drawnPolygonsLayer });
    }

    remove_all_polygons_menu = () => {
        // fonction lancer pour supprimer tous les polygons
        // on parcourt la liste des polygons 
        this.drawnPolygonsLayer.getSource().getFeatures().forEach((polygon) => {
            // on lance la fonction qui supprime les dalles du polygons supprimer (donc tous les polygons dans cette fonction)
            this.remove_dalle_in_polygon(polygon)
        });
        // on met la liste des polygons à 0
        this.drawnPolygonsLayer.getSource().clear();

        this.setState({ dalles_select: this.dalles_select });
        this.setState({ polygon_drawn: this.drawnPolygonsLayer });
        this.alert_limit_dalle()
    }

    alert_limit_dalle = () => {
        // fonction qui permet de colorier ou non en rouge si on dépasse la limit de dalle max
        if (this.dalles_select.length >= this.limit_dalle_select) {
            this.vectorSourceGridDalle.getFeatures().forEach((feature) => {

                // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
                if (feature.getStyle() !== null) {
                    feature.setStyle(new Style(this.style_dalle.alert_limite));
                }
            });
            this.alert_limit_dalle_state = true
        }
        else if (this.alert_limit_dalle_state === true && this.dalles_select.length < this.limit_dalle_select) {
            this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
                // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
                if (feature.getStyle() !== null) {
                    feature.setStyle(new Style(this.style_dalle.select));
                }
            });
            this.alert_limit_dalle_state = false
        }
    }

    zoom_to_polygon = (item) => {
        const polygon_extent = item.values_.geometry.extent_
        const map = this.state.mapInstance
        map.getView().fit(polygon_extent, { padding: [50, 50, 50, 50], maxZoom: 12 });
    }

    list_dalle_in_polygon = (polygon, statut) => {
        // fonction qui permet de lister les dalles 
        if (statut == "open") {
            var list_dalle_in_polygon = []
            this.dalles_select.forEach(dalle_select => {
                if (dalle_select.values_.properties.polygon == polygon.values_.id) {
                    list_dalle_in_polygon.push(dalle_select)
                }
            })
            // on regarde si il y'a des dalles dans le polygon ou l'on peut consulter les dalles, si il n'y en a pu alors on supprime le polygon
            if (list_dalle_in_polygon.length === 0)  {
                this.remove_polygon_menu(polygon)
            // sinon on laisse le polygon ouvert et on affiche les dalles de ce polygon
            }else{
                this.setState({ polygon_select_list_dalle: { "polygon": polygon, "dalles": list_dalle_in_polygon } })
            }
        } else {
             // on parcourt la liste des polygons 
            this.drawnPolygonsLayer.getSource().getFeatures().forEach((feature) => {
                // boolean qui va qu'on va mettre a false si le polygon a 1 dalle dans son emprise
                let polygonIsEmpty = true
                // on parcourt la liste des dalles selctionner pour verifier si le polygon à encore au moins 1 dalle dans son emprise
                this.dalles_select.forEach(dalle_select => {
                   // si une dalle est dans l'emprise du polygon alors on passe polygonIsEmpty a false
                    if (dalle_select.values_.properties.polygon === feature.values_.id) {
                        polygonIsEmpty = false    
                    }
                })
                // si le polygon est a true et n'a donc aucune dalle dans son emprise, alors on supprime le polygon
                if (polygonIsEmpty) {
                    // Suppression du polygon qui est vide
                    this.vectorSourceDrawPolygon.removeFeature(feature);
                } 
            });
            this.setState({ polygon_select_list_dalle: { "polygon": null, "dalles": [] } });
        }

    }

    handleModeChange = (mode) => {
        this.setState({ selectedMode: mode.target.value }, () => {
            // Cette fonction permet de changer de mode de selection et d'ajouter et supprimer les différentes interactions
            var map = this.state.mapInstance
            if (this.state.selectedMode == "polygon") {
                map.removeInteraction(this.selectInteractionClick)
                map.addInteraction(this.drawPolygon);
                map.removeInteraction(this.drawRectangle);
            } else if (this.state.selectedMode == "rectangle") {
                map.removeInteraction(this.selectInteractionClick)
                map.removeInteraction(this.drawPolygon);
                map.addInteraction(this.drawRectangle);
            } else if (this.state.selectedMode == "click") {
                map.addInteraction(this.selectInteractionClick);
                map.removeInteraction(this.drawPolygon)
                map.removeInteraction(this.drawRectangle);
            }
        });
    };

    pointerMoveDalleMenu = (id_dalle) => {
        // on parcours la liste des dalles
        this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
            // son recupere la feature avec la meme id que la dalle survolé dans le menu
            if (feature.values_.properties.id === id_dalle) {
                feature.setStyle(new Style(this.style_dalle.pointer_move_dalle_menu))
            }
        });
    }

    quitPointerMoveDalleMenu = (id_dalle) => {
        // on parcours la liste des dalles
        this.vectorSourceGridDalle.getFeatures().forEach((feature) => {
            // son recupere la feature avec la meme id que la dalle survolé dans le menu
            if (feature.values_.properties.id === id_dalle) {
                if (this.alert_limit_dalle_state === true) {
                    feature.setStyle(new Style(this.style_dalle.alert_limite))
                }else{
                    feature.setStyle(new Style(this.style_dalle.select))
                }
            }
        });
    }

    draw_emprise = (event, type) => {
        // fonction qui permet de dessiner une emprise avec un polygon ou rectangle
        // event est l'evenement du dessin
        // type est soit "rectangle" soit "polygon"
        var feature = event.feature
            // on ajoute l'id du polygon avec ces coordonnées
            var id = `${type}-${feature.getGeometry().getExtent().map(point => Math.round(point / 1000)).join('-')}`
            feature.setProperties({
                id: id
            });
            // on ajoute le polygon à la liste des polygons
            this.drawnPolygonsLayer.getSource().addFeature(feature);

            // Récupérer le polygone dessiné
            const polygon = feature.getGeometry();
            // On parcourt les polygones de la grille et on recupere les dalles dans ce polygon pour les selectionner
            this.vectorSourceGridDalle.getFeatures().forEach((dalle) => {
                if (polygon.intersectsExtent(dalle.values_.geometry.extent_)) {
                    // si un polygon est tracé sur des dalles déjà cliquer on ne les rajoute pas 
                    if (this.dalles_select.every(feature => feature.values_.properties.id !== dalle.values_.properties.id)) {
                        dalle.values_.properties.polygon = id
                        this.dalles_select.push(dalle);
                        dalle.setStyle(new Style(this.style_dalle.select))
                    }
                }
            });


            this.setState({ dalles_select: this.dalles_select });
            this.setState({ polygon_drawn: this.drawnPolygonsLayer });
            this.alert_limit_dalle()
    }

    componentDidMount() {
        axios.get(`http://${process.env.REACT_APP_HOST_API}:8000/hello_world`)
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });
        

        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + this.day_cookie_expiration)
        // expiration des cookies
        this.setState({ expiresDateCookie: expiresDate});

        var createMap = () => {
            var map = new Map({
                target: "map",
                layers: [
                    new olExtended.layer.GeoportalWMTS({
                        layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"
                    }),
                    this.vectorLayer, // Ajout de la couche qui affichera les polygons
                    this.drawnPolygonsLayer // ajout de la couche qui affichera le polygon pour séléectionner des dalles
                ],
                view: new View({
                    center: this.state.cookie_coor_start,
                    zoom: this.state.cookie_zoom_start,
                    maxZoom: 16,
                })
            });

            // on stocke la map dans une variable du contructeur, pour pouvoir l'utiliser dans d'autre fonction
            this.setState({ mapInstance: map });

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
                    // quand on survole une dalle cliquer on met le style d'une dalle cliquer
                    this.style_dalle_select(selectedFeature)
                }
                // quand on quitte la dalle survolé
                if (event.deselected.length > 0) {
                    if (this.old_dalles_select !== null) {
                        var selected = this.style_dalle_select(this.old_dalles_select)
                        if (!selected) {
                            // si on survol une dalle non cliqué alors on remet le style null
                            this.old_dalles_select.setStyle(null);
                        }
                    }
                }
                // on stocke la derniere dalle survoler pour modifier le style
                this.old_dalles_select = selectedFeature
            });


            this.selectInteractionClick = new Select({
                condition: function (event) {
                    return event.type === 'click';
                },
                layers: [this.vectorLayer],
            });

            // évenement au click d'une salle
            this.selectInteractionClick.on('select', (event) => {
                if (event.selected.length > 0) {
                    const featureSelect = event.selected[0];
                    // variable qui va valider si la dalle est dans liste sur laquelle on boucle 
                    var newSelect = false

                    if (this.dalles_select.length === 0) {
                        // au clique sur une dalle pas selectionner on l'ajoute à la liste

                        featureSelect.setStyle(new Style(this.style_dalle.select))
                        this.dalles_select.push(featureSelect);
                    } else {
                        this.dalles_select.forEach((dalle_select, index) => {
                            if (dalle_select["values_"]["properties"]["id"] === featureSelect["values_"]["properties"]["id"]) {
                                // au clique sur une dalle déjà selectionner on la supprime
                                this.dalles_select.splice(index, 1);
                                featureSelect.setStyle(null);
                                // on passe la variable à true pour dire qu'on vient de la selectionner
                                newSelect = true
                            }
                        });
                        // si la dalle n'est pas à true c'est quelle est dans la liste, donc on la deselectionne
                        if (!newSelect) {
                            // au clique sur une dalle pas selectionner on l'ajoute à la liste
                            featureSelect.setStyle(new Style(this.style_dalle.select))
                            this.dalles_select.push(featureSelect);
                        }
                    }

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
                this.alert_limit_dalle()
            });

            // Créer une interaction de tracé de polygon
            this.drawPolygon = new Draw({
                type: 'Polygon',
            });

            this.drawPolygon.on('drawend', (event) => {
                this.draw_emprise(event, "polygon")
            });


            this.drawRectangle = new Draw({
                type: 'Circle', 
                geometryFunction: createBox(), 
                });
            
            this.drawRectangle.on('drawend', (event) => {
                this.draw_emprise(event, "rectangle");
            });
             

            const mouseMoveListener = (event) => {
                const pixel = map.getEventPixel(event.originalEvent);
                const lonLat = map.getCoordinateFromPixel(pixel);
                this.setState({ coor_mouse: lonLat });
              };
          
            map.on('pointermove', mouseMoveListener);

            
            // Ajout de l'interaction de sélection à la carte
            map.addInteraction(this.selectInteractionClick);
            map.addInteraction(selectInteraction);

            // Lorsque qu'on se déplace sur la carte
            map.on('moveend', () => {

                var view = map.getView();
                this.setState({ zoom: view.getZoom() });
                // creation du cookie 
                const { cookies } = this.props;
                // on set le cookie à chaque fois qu'on zoom
                cookies.set('zoom', this.state.zoom, { expires: this.state.expiresDateCookie });
                // on set le cookie avec les coordonnées à chaque fois qu'on bouge sur la carte
                cookies.set('coor', view.getCenter(), { expires: this.state.expiresDateCookie });
                // recupere la bbox de la fenetre de son pc
                var extent = view.calculateExtent(map.getSize());

                // Efface les anciens polygones
                this.vectorSourceGridDalle.clear();

                if (view.getZoom() >= this.zoom_dispaly_dalle) {
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
                                    if (this.alert_limit_dalle_state === true) {
                                        feature.setStyle(new Style(this.style_dalle.alert_limite))
                                    } else {
                                        feature.setStyle(new Style(this.style_dalle.select))
                                    }

                                }
                            });


                            // Ajoutez des polygons à la couche vecteur
                            this.vectorSourceGridDalle.addFeature(feature);
                        }
                    }
                }else{
                    this.handleModeChange({"target": {"value": "click"}})
                }
            });
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
                    {this.state.coor_mouse !== null ? (
                        <p className='menu_mode'>{Math.round(this.state.coor_mouse[0])} - {Math.round(this.state.coor_mouse[1])}</p>
                        ) : ( null )}
                    
                    {this.state.zoom >= this.zoom_dispaly_dalle ? (
                        <div className='menu_mode'>
                            <Card title="Choix du mode de séléction" >
                                <Radio.Group onChange={this.handleModeChange} value={this.state.selectedMode}>
                                    <Radio value={'click'}>Click</Radio>
                                    <Radio value={'polygon'}>Polygon</Radio>
                                    <Radio value={'rectangle'}>Rectangle</Radio>
                                </Radio.Group>
                            </Card>
                        </div>
                    ) : null}

                    <div className="dalle-select">
                        <h3 className="mt-4">Nuages de points classés</h3>
                        {this.state.dalles_select.length === 0 ? (
                            <p>Aucune données séléctionnées.</p>
                        ) : (
                            <React.Fragment>
                                {this.state.dalles_select.length >= this.limit_dalle_select ? (
                                    <p className="text_red">Nombre de dalles séléctionnées : {this.state.dalles_select.length}/{this.limit_dalle_select}</p>
                                ) : (<p>Nombre de dalles séléctionnées : {this.state.dalles_select.length}/{this.limit_dalle_select}</p>)}

                                <button onClick={() => this.remove_all_dalle_menu()}><MdDelete style={{ color: 'red' }} /> Supprimer toutes les dalles </button>
                                <div className="outer-div">
                                {this.state.dalles_select.map((item, index) => (
                                    <div className="liste_dalle inner-div" key={index}>
                                        <button className='map-icon-button' onClick={() => this.remove_dalle_menu(index, item)}><FaTimes style={{ color: 'red' }} /></button>
                                        <button className='map-icon-button' onClick={() => this.zoom_to_polygon(item)}><FaMapMarker /></button>
                                        <p 
                                        onMouseEnter={() => this.pointerMoveDalleMenu(item.values_.properties.id)}
                                        onMouseLeave={() => this.quitPointerMoveDalleMenu(item.values_.properties.id)}
                                        >
                                        {item.values_.properties.id}</p>
                                    </div>
                                ))}
                                </div>
                            </React.Fragment>
                            

                        )}
                    
                    <h3>Produits dérivés</h3>
                    <p>Pas encore disponible</p>
                    </div>
                    <br/>
                    <br/>
                    <br/>
                    {this.drawnPolygonsLayer.getSource().getFeatures().length !== 0 ? (
                        <div className="polygon_drawn">

                            <React.Fragment>
                                <h5>Affichage des polygons tracés</h5>
                                <p>Nombre de polygons séléctionnées : {this.drawnPolygonsLayer.getSource().getFeatures().length}</p>

                                <button onClick={() => this.remove_all_polygons_menu()}><MdDelete style={{ color: 'red' }} /> Supprimer tous les polygons</button>
                                <div className="outer-div">
                                {this.drawnPolygonsLayer.getSource().getFeatures().map((polygon, index) => (
                                    <div>
                                        <div className="liste_dalle" key={index}>
                                            <button className='map-icon-button' onClick={() => this.remove_polygon_menu(polygon)}>
                                                <FaTimes style={{ color: 'red' }} />
                                            </button>
                                            <button className='map-icon-button' onClick={() => this.zoom_to_polygon(polygon)}>
                                                <FaMapMarker />
                                            </button>

                                            {this.state.polygon_select_list_dalle.polygon !== polygon ? (
                                                <>
                                                    <button className='map-icon-button' onClick={() => this.list_dalle_in_polygon(polygon, "open")}>
                                                        <BsChevronLeft style={{ strokeWidth: '3px' }} />
                                                    </button>
                                                    <p>{polygon.values_.id}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <button className='map-icon-button' onClick={() => this.list_dalle_in_polygon(polygon, "close")}>
                                                        <BsChevronDown style={{ strokeWidth: '3px' }} />
                                                    </button>
                                                    <p>{polygon.values_.id}</p>
                                                </>
                                            )}
                                        </div>
                                    

                                        {this.state.polygon_select_list_dalle.polygon === polygon ? (
                                            <div className="dalle-select-polygon">
                                                {this.state.polygon_select_list_dalle.dalles.map((dalle, key) => (
                                                    <div className="liste_dalle" key={key}>
                                                        <button className='map-icon-button' onClick={() => this.remove_dalle_menu(null, dalle, polygon)}>
                                                            <FaTimes style={{ color: 'red' }} />
                                                        </button>
                                                        <button className='map-icon-button' onClick={() => this.zoom_to_polygon(dalle)}>
                                                            <FaMapMarker />
                                                        </button>
                                                        <p
                                                        onMouseEnter={() => this.pointerMoveDalleMenu(dalle.values_.properties.id)}
                                                        onMouseLeave={() => this.quitPointerMoveDalleMenu(dalle.values_.properties.id)}
                                                        >{dalle.values_.properties.id}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            null
                                        )}


                                    </div>
                                    
                                ))}
                                </div>
                            </React.Fragment>


                        </div>
                    ) : null}

                </div>
            </div>
        );
    }
}

export default withCookies(App);

