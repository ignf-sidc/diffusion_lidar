function interactionClickSelect() {
    const selectInteractionClick = new Select({
        condition: function (event) {
          return event.type === "click";
        },
        layers: [dalleLayer],
      });
    
      selectInteractionClick.on("select", (event) => {
        if (event.selected.length > 0) {
          const featureSelect = event.selected[0];
    
          if (MapState.dalles_select.length === 0) {
            // au clique sur une dalle pas selectionner on l'ajoute à la liste
    
            featureSelect.setStyle(new Style(style_dalle.select));
            const add_dalles = MapState.dalles_select.push(featureSelect);
            setMapState({ ...MapState, dalles_select: [featureSelect] });
          } else {
            // variable qui va valider si la dalle est dans liste sur laquelle on boucle
            let isSelected = false;
    
            MapState.dalles_select.forEach((dalle_select, index) => {
              if (
                dalle_select["values_"]["properties"]["id"] ===
                featureSelect["values_"]["properties"]["id"]
              ) {
                // Supression de la dalle séléctionné
                MapState.dalles_select.splice(index, 1);
                featureSelect.setStyle(null);
                // La dalle etait séléctionné on passe à true
                isSelected = true;
                list_dalle_in_polygon(null, "close");
              }
            });
            if (!isSelected) {
              // au clique sur une dalle pas selectionner on l'ajoute à la liste
              featureSelect.setStyle(new Style(style_dalle.select));
    
              const add_dalles = MapState.dalles_select.push(featureSelect);
              setMapState({
                ...MapState,
                dalles_select: [...MapState.dalles_select, featureSelect],
              });
              click_select(
                featureSelect,
                vectorSourceGridDalle,
                limit_dalle_select,
                MapState
              );
            }
          }
        }
        return interactionClickSelect
    
}