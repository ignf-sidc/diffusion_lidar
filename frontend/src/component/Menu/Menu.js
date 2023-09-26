import React, { useContext } from "react";
import PropTypes from "prop-types";
import { MenuMode } from "./MenuMode.js";
import { MapContext } from "../../App.js";

export const Menu = (props) => {
  const {MapState, setMapState, zoom} = useContext(MapContext)
  return (
    <div className="menu">
      {MapState.coordinate_mouse !== null ? (
        <p className="menu_mode">
          {Math.round(MapState.coordinate_mouse[0])} -{" "}
          {Math.round(MapState.coordinate_mouse[1])}
        </p>
      ) : null}

      {MapState.zoom >= props.zoom_display_dalle ? (
        <MenuMode
            MapState= {MapState}
            selectInteractionClick= {props.selectInteractionClick}
            drawPolygon={props.drawPolygon}
            drawRectangle={props.drawRectangle}
        />
      ) : null}

      <div className="dalle-select">
        {MapState.dalles_select.length === 0 ? (
          <h3 className="center">Aucune données séléctionnées.</h3>
        ) : (
          <React.Fragment>
            {MapState.dalles_select.length >= props.limit_dalle_select ? (
              <h5 className="text_red">
                Nombre de dalles séléctionnées :{" "}
                {MapState.dalles_select.length}/{props.limit_dalle_select}
              </h5>
            ) : (
              <h5>
                Nombre de dalles séléctionnées :{" "}
                {MapState.dalles_select.length}/{props.limit_dalle_select}
              </h5>
            )}
            <Collapse items={items_collapse_liste_produit}></Collapse>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};
Menu.propTypes = {
  selectInteractionClick: PropTypes.object,
  drawPolygon:PropTypes.object,
  drawRectangle: PropTypes.object,
  zoom_display_dalle: PropTypes.number,
  limit_dalle_select: PropTypes.number,
};
