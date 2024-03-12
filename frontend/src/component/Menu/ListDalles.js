export const listDalles = (props) => {
    
    return(
    <div>
      <div className="outer-div">
        {this.state.dalles_select.map((item, index) => (
          <div className="liste_dalle inner-div" key={index}>
            <button
              className="map-icon-button"
              onClick={() => this.remove_dalle_menu(index, item)}
            >
              <FaTimes style={{ color: "red" }} />
            </button>
            <button
              className="map-icon-button"
              onClick={() => this.zoom_to_polygon(item, 12)}
            >
              <FaMapMarker />
            </button>
            <a
              href={item.values_.properties.url_download}
              onMouseEnter={() =>
                this.pointerMoveDalleMenu(item.values_.properties.id)
              }
              onMouseLeave={() =>
                this.quitPointerMoveDalleMenu(item.values_.properties.id)
              }
            >
              {item.values_.properties.id}
            </a>
          </div>
        ))}
      </div>
    </div>
  )};