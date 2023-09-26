
function zoom_to_polygon(item, niv_zoom,mapInstance)  {
    if (item){
        const polygon_extent = item.values_.geometry.extent_
        mapInstance.getView().fit(polygon_extent, { padding: [50, 50, 50, 50] });
        mapInstance.getView().setZoom(niv_zoom);
    }
}

function zoom_to_multi_polygon (item, mapInstance) {
    let extent = item[0].getExtent();
    for (let i = 1; i < item.length; i++) {
        extent = extent.concat(item[i].getExtent());
    }
    const map = mapInstance
    map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 12 });
}

export {zoom_to_polygon, zoom_to_multi_polygon}