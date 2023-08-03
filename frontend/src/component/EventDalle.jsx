
import { Select, Draw } from "ol/interaction";

function eventSelect(evenType, vectorLayer) {
  // Créer une interaction de sélection pour gérer le survol des polygones
  const selectInteraction = new Select({
    condition: function (event) {
      return event.type === evenType;
    },
    layers: [vectorLayer],
  });

  // évenement au survol d'une salle
  selectInteraction.on("select", (event) => {
    if (evenType == 'pointermove'){
        eventSelectSurvol(event)
    }
  });

  return selectInteraction
}

function eventSelectSurvol(event) {
  if (event.selected.length > 0) {
    var selectedFeature = event.selected[0];
    var coordinate = event.mapBrowserEvent.coordinate;

    // Afficher les informations de la dalle dans une fenêtre contextuelle (popup)
    overlay.getElement().innerHTML =
      selectedFeature["values_"]["properties"]["id"];
    overlay.setPosition(coordinate);
    overlay.getElement().style.display = "block";
    // quand on survole une dalle cliquer on met le style d'une dalle cliquer
    this.style_dalle_select(selectedFeature);
  }
  // quand on quitte la dalle survolé
  if (event.deselected.length > 0) {
    if (this.old_dalles_select !== null) {
      var selected = this.style_dalle_select(this.old_dalles_select);
      if (!selected) {
        // si on survol une dalle non cliqué alors on remet le style null
        this.old_dalles_select.setStyle(null);
      }
    }
  }
  // on stocke la derniere dalle survoler pour modifier le style
  this.old_dalles_select = selectedFeature;
}

export default eventSelect