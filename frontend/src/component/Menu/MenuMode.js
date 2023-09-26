import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Card, Radio, Upload, Space } from "antd";
import {
  handle_mode_change,
  handle_upload,
  handle_upload_remove,
  handle_telechargement,
} from "../../hook/useHandle";
import { MapContext } from "../../App.js";

export const MenuMode = (props) => {
  const {state, setState} = useContext(MapContext);

  return (
    <div className="menu_mode">
      <Card title="Choix du mode de séléction">
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Radio.Group
            onChange={setState({
              selectedMode: handle_mode_change(
                { target: { value: "click" } },
                state.mapInstance,
                state.selectedMode,
                props.selectInteractionClick,
                props.drawPolygon,
                props.drawRectangle
              ),
            })}
            value={state.selectedMode}
          >
            <Radio value={"click"}>Click</Radio>
            <Radio value={"polygon"}>Polygon</Radio>
            <Radio value={"rectangle"}>Rectangle</Radio>
          </Radio.Group>
          <Upload
            maxCount={1}
            accept=".geojson"
            action={`${state.api_url}:8000/upload/geojson`}
            onChange={handle_upload}
            onRemove={handle_upload_remove}
          >
            <Button icon={<UploadOutlined />}>Upload Geojson</Button>
          </Upload>
        </Space>
      </Card>
      <br />
      <Collapse items={items_collapse_liste_polygons}></Collapse>
      <br />
      {state.dalles_select.length > 0 ? (
        <div className="center">
          <Button
            onClick={handle_telechargement}
            type="default"
            icon={<DownloadOutlined />}
            size="large"
          >
            Télécharger liste des dalles
          </Button>
        </div>
      ) : null}
    </div>
  );
};
MenuMode.propTypes = {
  selectInteractionClick: PropTypes.object,
  drawPolygon: PropTypes.object,
  drawRectangle: PropTypes.object,
};
