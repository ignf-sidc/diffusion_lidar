import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import "../node_modules/geoportal-extensions-openlayers/dist/GpPluginOpenLayers.css";
import "../node_modules/ol/ol.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
