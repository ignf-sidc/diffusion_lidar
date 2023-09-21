import React from 'react';
import PropTypes from 'prop-types';
import { Form, Select, Space } from 'antd';
import { DeleteField } from './DeleteField.jsx';
import { handle_mode_change, handle_upload, handle_upload_remove } from '../hook/useHandle';
import { MenuMode } from './MenuMode.js';

export const Menu = (props) => {
    
    return (
        <div className="menu">
          {props.coordinate_mouse !== null ? (
            <p className="menu_mode">
              {Math.round(props.coordinate_mouse[0])} -{" "}
              {Math.round(props.coordinate_mouse[1])}
            </p>
          ) : null}

          {props.zoom >= props.zoom_dispaly_dalle ? (
            <MenuMod props={zoom:props.zoom, props.selectedMode, props.dalles_select}/>
          ) : null}

          <div className="dalle-select">
            {props.dalles_select.length === 0 ? (
              <h3 className="center">Aucune données séléctionnées.</h3>
            ) : (
              <React.Fragment>
                {props.dalles_select.length >= props.limit_dalle_select ? (
                  <h5 className="text_red">
                    Nombre de dalles séléctionnées :{" "}
                    {props.dalles_select.length}/{props.limit_dalle_select}
                  </h5>
                ) : (
                  <h5>
                    Nombre de dalles séléctionnées :{" "}
                    {props.dalles_select.length}/{props.limit_dalle_select}
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
    coordinate_mouse: PropTypes.list,
    zoom: PropTypes.number,
    zoom_dispaly_dalle: PropTypes.number,
    selectedMode: PropTypes.string,
    dalles_select: PropTypes.list,
    limit_dalle_select: PropTypes.number
};
