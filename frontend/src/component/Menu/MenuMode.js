import React from 'react';
import PropTypes from 'prop-types';
import { Form, Select, Space } from 'antd';
import { DeleteField } from './DeleteField.jsx';
import { handle_mode_change, handle_upload, handle_upload_remove, handle_telechargement } from '../hook/useHandle';

export const MenuMode = (props) => {
    
    return (
            <div className="menu_mode">
              <Card title="Choix du mode de séléction">
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="large"
                >
                  <Radio.Group
                    onChange={handle_mode_change}
                    value={props.selectedMode}
                  >
                    <Radio value={"click"}>Click</Radio>
                    <Radio value={"polygon"}>Polygon</Radio>
                    <Radio value={"rectangle"}>Rectangle</Radio>
                  </Radio.Group>
                  <Upload
                    maxCount={1}
                    accept=".geojson"
                    action={`${props.api_url}:8000/upload/geojson`}
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
              {props.dalles_select.length > 0 ? (
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
    )
};
Menu.propTypes = {
    zoom: PropTypes.number,
    selectedMode: PropTypes.string,
    dalles_select: PropTypes.list
};
