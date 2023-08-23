import * as React from "react";


function MapView() {
  return (
    <>
      <div className="map-container">
        <div id="map"></div>
        <div id="popup" className="ol-popup">
          <div id="popup-content"></div>
        </div>
      </div>
    </>
  );
}

export default MapView;
