import { Select, Draw } from "ol/interaction";

function eventSelect(
  evenType,
  vectorLayer,
  overlay = null,
  style_dalle = null,
  old_dalles_select = null,
  dalles_select = null,
  alert_limit_dalle_state = null
) {
  // Créer une interaction de sélection pour gérer le survol des polygones
  const selectInteraction = new Select({
    condition: function (event) {
      return event.type === evenType;
    },
    layers: [vectorLayer],
  });

  // évenement au survol d'une salle
  selectInteraction.on("select", (event) => {
    if (evenType == "pointermove") {
      eventSelectSurvol(event, overlay, style_dalle, old_dalles_select, dalles_select, alert_limit_dalle_state);
    }
  });

  return selectInteraction;
}

function eventSelectSurvol(event, overlay, style_dalle, old_dalles_select, dalles_select, alert_limit_dalle_state) {
  if (event.selected.length > 0) {
    var selectedFeature = event.selected[0];
    var coordinate = event.mapBrowserEvent.coordinate;

    // Afficher les informations de la dalle dans une fenêtre contextuelle (popup)
    overlay.getElement().innerHTML =
      selectedFeature["values_"]["properties"]["id"];
    overlay.setPosition(coordinate);
    overlay.getElement().style.display = "block";
    // quand on survole une dalle cliquer on met le style d'une dalle cliquer
    style_dalle_select(selectedFeature, style_dalle,  dalles_select, alert_limit_dalle_state);
  }
  // quand on quitte la dalle survolé
  if (event.deselected.length > 0) {
    if (old_dalles_select !== null) {
      const selected = style_dalle_select(old_dalles_select, style_dalle, dalles_select, alert_limit_dalle_state);
      if (!selected) {
        // si on survol une dalle non cliqué alors on remet le style null
        old_dalles_select.setStyle(null);
      }
    }
  }
  // on stocke la derniere dalle survoler pour modifier le style
  old_dalles_select = setState({old_dalles_select:selectedFeature});
}

function style_dalle_select(feature, style_dalle, dalles_select, alert_limit_dalle_state) {
  // fonction permettant d'ajuster le style au survol d'une dalle
  // on parcout la liste des dalles selectionner
  for (const dalle_select of dalles_select) {
    // si la dalle est selectionner alors au survol on lui laisse le style select et on retourne true
    if (
      dalle_select["values_"]["properties"]["id"] ===
      feature["values_"]["properties"]["id"]
    ) {
      if (alert_limit_dalle_state === true) {
        feature.setStyle(new Style(style_dalle.alert_limite));
      } else {
        feature.setStyle(new Style(style_dalle.select));
      }

      return true;
    }
  }
  // si la dalle n'est pas dans la liste on retourne false
  return false;
}

export default eventSelect;
