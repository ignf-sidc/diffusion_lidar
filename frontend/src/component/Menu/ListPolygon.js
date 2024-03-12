export const list_polygons = (props) => {
    
    return(
    <div>
      <h4 style={{ margin: "0" }}>
        Nombre de sélections : {features.length}
      </h4>
      <div className="outer-div">
        {features.map((polygon, index) => (
          <div key={index}>
            <div className="liste_dalle">
              <button
                className="map-icon-button"
                onClick={() => this.remove_polygon_menu(polygon)}
              >
                <FaTimes style={{ color: "red" }} />
              </button>
              <button
                className="map-icon-button"
                onClick={() => this.zoom_to_polygon(polygon, 12)}
              >
                <FaMapMarker />
              </button>

              {this.state.polygon_select_list_dalle.polygon !== polygon ? (
                <>
                  <button
                    className="map-icon-button"
                    onClick={() =>
                      this.list_dalle_in_polygon(polygon, "open")
                    }
                  >
                    <BsChevronLeft style={{ strokeWidth: "3px" }} />
                  </button>
                  <p>{polygon.values_.id}</p>
                </>
              ) : (
                <>
                  <button
                    className="map-icon-button"
                    onClick={() =>
                      this.list_dalle_in_polygon(polygon, "close")
                    }
                  >
                    <BsChevronDown style={{ strokeWidth: "3px" }} />
                  </button>
                  <p>{polygon.values_.id}</p>
                </>
              )}
            </div>

            {this.state.polygon_select_list_dalle.polygon === polygon ? (
              <div className="dalle-select-polygon">
                {this.state.polygon_select_list_dalle.dalles.map(
                  (dalle, key) => (
                    <div className="liste_dalle" key={key}>
                      <button
                        className="map-icon-button"
                        onClick={() =>
                          this.remove_dalle_menu(null, dalle, polygon)
                        }
                      >
                        <FaTimes style={{ color: "red" }} />
                      </button>
                      <button
                        className="map-icon-button"
                        onClick={() => this.zoom_to_polygon(dalle, 12)}
                      >
                        <FaMapMarker />
                      </button>
                      <a
                        href={dalle.values_.properties.url_download}
                        onMouseEnter={() =>
                          this.pointerMoveDalleMenu(
                            dalle.values_.properties.id
                          )
                        }
                        onMouseLeave={() =>
                          this.quitPointerMoveDalleMenu(
                            dalle.values_.properties.id
                          )
                        }
                      >
                        {dalle.values_.properties.id}
                      </a>
                    </div>
                  )
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )};