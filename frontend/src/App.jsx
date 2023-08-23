import * as React from "react";
import MapController from "./Map/MapController";

function App() {

  return (
    <>
      <MapController
        zoomStart={6}
        zoomDisplayDalle={11}
        tileSize={1000}
        limitDalleSelect={5}
      />
    </>
  );
}

export default App;
