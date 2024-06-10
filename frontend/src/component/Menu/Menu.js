// import React, { useContext, useState } from "react";
// import { RadioChangeEvent } from "antd";
// import PropTypes from "prop-types";
// import { MapContext } from "../../App.jsx";
// import { Card, Space, Radio, Collapse, Button, Modal } from "antd";
// import {
//   handle_mode_change,
//   handle_telechargement,
// } from "../../hook/useHandle.js";
// import {
//   remove_all_dalle_menu,
//   remove_all_polygons_menu,
// } from "../../hook/useRemove.js";
// import { listPolygons, list_polygons } from "./ListPolygon.js";
// import {
//   DownloadOutlined,
//   DeleteOutlined,
//   QuestionCircleOutlined,
// } from "@ant-design/icons";
// import { list_dalles } from "../../hook/useUtils.js";


// function Menu({},ref) {
//   const {
//     MapState,
//     selectedMode,
//     setSelectedMode,
//     dalleLayer,
//     style_dalle,
//     dalleState
//   } = useContext(MapContext);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const onChange = (e: RadioChangeEvent) => {
//     setSelectedMode(e.target.value);
//   };

//   const showModal = () => {
//     setIsModalOpen(true);
//   };

//   const handleOk = () => {
//     setIsModalOpen(false);
//   };

//   const items_collapse_liste_polygons = [
//     {
//       key: "1",
//       label: "Liste des emprises",
//       children: listPolygons,
//       extra: (
//         <DeleteOutlined
//           style={{ color: "red" }}
//           onClick={remove_all_polygons_menu}
//         />
//       ),
//     },
//   ];

//   const items_collapse_liste_produit = [
//     {
//       key: "1",
//       label: "Liste des nuages de points classés",
//       children: list_dalles(dalleState, ref, dalleLayer, style_dalle),
//       extra: (
//         <DeleteOutlined
//           style={{ color: "red" }}
//           onClick={remove_all_dalle_menu}
//         />
//       ),
//     },
//     // {
//     //     key: '2',
//     //     label: 'Liste des MNS',
//     //     children: <p>Donnée non disponible.</p>,
//     // },
//     // {
//     //     key: '3',
//     //     label: 'Liste des MNT',
//     //     children: <p>Donnée non disponible.</p>,
//     // },
//     // {
//     //     key: '4',
//     //     label: 'Autres',
//     //     children: <p>Donnée non disponible.</p>,
//     // },
//   ];

//   return (
//     <div className="menu">
//       {MapState.zoom >= 11? (
//         <div className="menu_mode">
//           <Card title="Choix du mode de sélection">
//             <Space direction="vertical" style={{ width: "100%" }} size="large">
//               <Radio.Group onChange={onChange} value={selectedMode}>
//                 <Radio value={"click"}>Clic</Radio>
//                 <Radio value={"polygon"}>Polygone</Radio>
//                 <Radio value={"rectangle"}>Rectangle</Radio>
//               </Radio.Group>
//               {/* <Upload
//               maxCount={1}
//               accept=".geojson"
//               action={`${this.state.api_url}/api/upload/geojson`}
//               onChange={this.handleUpload}
//               onRemove={this.handleUploadRemove}
//             >
//               <Button icon={<UploadOutlined />}>
//                 Téléverser un GéoJSON (en lambert 93)
//               </Button>
//             </Upload> */}
//             </Space>
//           </Card>
//           <br />
//           <Collapse items={items_collapse_liste_polygons}></Collapse>
//           <br />
//         </div>
//       ) : null}
//       <div className="dalle-select">
//         {dalleState.dalles_select.length === 0 ? (
//           <h3 className="center">Aucune donnée sélectionnée.</h3>
//         ) : (
//           <React.Fragment>
//             {dalleState.dalles_select.length >= props.limit_dalle_select ? (
//               <h5 className="text_red">
//                 Nombre de dalles sélectionnées : {dalleState.dalles_select.length}
//                 /{props.limit_dalle_select}
//               </h5>
//             ) : (
//               <h5>
//                 Nombre de dalles sélectionnées : {dalleState.dalles_select.length}
//                 /{props.limit_dalle_select}
//               </h5>
//             )}
//             <Collapse items={items_collapse_liste_produit}></Collapse>
//           </React.Fragment>
//         )}
//       </div>
//       {dalleState.dalles_select.length > 0 ? (
//         <div className="center">
//           <Space>
//             <Button
//               onClick={handle_telechargement}
//               type="default"
//               icon={<DownloadOutlined />}
//               size="large"
//             >
//               Télécharger la liste des liens
//             </Button>
//             <Button
//               type="primary"
//               onClick={showModal}
//               icon={<QuestionCircleOutlined />}
//             ></Button>
//             <Modal
//               title="Info téléchargement"
//               open={isModalOpen}
//               onOk={handleOk}
//               onCancel={handleOk}
//               width={650}
//               cancelButtonProps={{ style: { display: "none" } }}
//             >
//               <div>
//                 Comment télécharger les données ?
//                 <ul>
//                   <li>
//                     Cette interface vous permet de récupérer la liste des
//                     données vous intéressent.
//                   </li>
//                   <li>
//                     Pour récupérer les données facilement, il faudra automatiser
//                     le téléchargement.
//                   </li>
//                   <li>
//                     Pour cela, vous pouvez utiliser les applicatifs suivants
//                     (par exemple) :
//                   </li>
//                   <ul>
//                     <li>
//                       <a href="https://xtremedownloadmanager.com/">
//                         Xtreme Download Manager
//                       </a>
//                     </li>
//                     <li>
//                       <a href="https://www.downthemall.net/">DownThemAll!</a>
//                     </li>
//                   </ul>
//                 </ul>
//                 Pour plus d'explication n'hésitez pas à regerde cette courte
//                 vidéo:
//                 <iframe
//                   width="560"
//                   height="315"
//                   src="https://www.youtube.com/embed/-YomQJC6S38?si=ycCCdLbQ4KmMNSqn&amp;start=59"
//                   title="YouTube video player"
//                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//                   allowFullScreen
//                 ></iframe>
//               </div>
//             </Modal>
//           </Space>
//         </div>
//       ) : null}
//       {MapState.coordinate_mouse !== null ? (
//         <Card>
//           <div
//             style={{ margin: "0", fontSize: "16px", fontWeight: "bold" }}
//             className="menu_mode center"
//           >
//             <p>Coordonnées (lambert 93) :</p>
//             <p>
//               {Math.round(MapState.coordinate_mouse[0])} -{" "}
//               {Math.round(MapState.coordinate_mouse[1])}
//             </p>
//           </div>
//         </Card>
//       ) : null}
//     </div>
//   );
// };
// Menu.propTypes = {
//   selectInteractionClick: PropTypes.object,
//   drawPolygon: PropTypes.object,
//   drawRectangle: PropTypes.object,
//   zoom_display_dalle: PropTypes.number,
//   limit_dalle_select: PropTypes.number,
// };

// export default React.forwardRef(Menu);