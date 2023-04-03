import React, { useEffect } from "react";
import {
  MapContainer,
  WMSTileLayer,
  TileLayer,
  LayersControl,
  LayerGroup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function App() {
  useEffect(() => {}, []);
  const center = [47.390387412304094, 2.3483664012334238];

  return (
    <MapContainer center={center} zoom={6} scrollWheelZoom={false}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="IGN topo">
          <LayerGroup>
            <WMSTileLayer
              url="https://wxs.ign.fr/essentiels/geoportail/r/wms?'"
              params={{
                layers: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
                continuousWorld: true,
              }}
            />
          </LayerGroup>
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellites">
          <LayerGroup>
            <WMSTileLayer
              url='https://wxs.ign.fr/essentiels/geoportail/r/wms?'
              params={{
                layers: 'ORTHOIMAGERY.ORTHOPHOTOS',
                continuousWorld: true,
              }}
              
            />
          </LayerGroup>
        </LayersControl.BaseLayer>
      </LayersControl>
    </MapContainer>
  );
}

export default App;
