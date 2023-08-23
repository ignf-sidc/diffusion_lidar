
import { Style} from 'ol/style';

function eventSelectSurvol(
  event,
  style_dalle,
  old_dalles_select,
  dalles_select,
  limit_dalle
) {
  if (event.selected.length > 0) {
    var selectedFeature = event.selected[0];

    // quand on survole une dalle cliquer on met le style d'une dalle cliquer
    style_dalle_select(
      selectedFeature,
      style_dalle,
      dalles_select,
      limit_dalle
    );
  }
  // quand on quitte la dalle survolé
  if (event.deselected.length > 0) {
    if (old_dalles_select !== null) {
      const selected = style_dalle_select(
        old_dalles_select,
        style_dalle,
        dalles_select,
        limit_dalle
      );
      if (!selected) {
        // si on survol une dalle non cliqué alors on remet le style null
        old_dalles_select.setStyle(null);
      }
    }
  }
  // on stocke la derniere dalle survoler pour modifier le style
  return selectedDalles;
}

function eventSelectClick(event, dalles_select, style_dalle) {

  if (event.selected.length > 0) {

    const featureSelect = event.selected[0];
    // variable qui va valider si la dalle est dans liste sur laquelle on boucle
    var newSelect = false;


    if (dalles_select.length === 0) {
      // au clique sur une dalle pas selectionner on l'ajoute à la liste

      featureSelect.setStyle(new Style(style_dalle.select));
      dalles_select.push(featureSelect);
    } else {
      dalles_select.forEach((dalle_select, index) => {
        if (
          dalle_select["values_"]["properties"]["id"] ===
          featureSelect["values_"]["properties"]["id"]
        ) {
          // au clique sur une dalle déjà selectionner on la supprime
          dalles_select.splice(index, 1);
          featureSelect.setStyle(null);
          // on passe la variable à true pour dire qu'on vient de la selectionner
          newSelect = true;
        }
      });
      // si la dalle n'est pas à true c'est quelle est dans la liste, donc on la deselectionne
      if (!newSelect) {
        // au clique sur une dalle pas selectionner on l'ajoute à la liste
        featureSelect.setStyle(new Style(style_dalle.select));
        dalles_select.push(featureSelect);
      }
    }
  }
  // au click d'une dalle, on regarde la dalle qu'on a cliquer juste avant pour lui assigner un style
  // si la dalle qu'on a cliquer avant est dans la liste des dalles selectionner alors on lui ajoute le style d'une dalle selectionner
  if (event.deselected.length > 0) {
    const featureDeselect = event.deselected[0];
    if (dalles_select.indexOf(event.deselected[0]) > -1) {
      featureDeselect.setStyle(new Style(style_dalle.select));
    } else {
      featureDeselect.setStyle(null);
    }
  }
  return dalles_select ;
}



function alert_limit_dalle (style_dalle,vectorSourceGridDalle,limit_dalle,dalles_select,limit_dalle_select){
  // fonction qui permet de colorier ou non en rouge si on dépasse la limit de dalle max
  if (dalles_select.length >= limit_dalle_select) {
      vectorSourceGridDalle.getFeatures().forEach((feature) => {

          // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
          if (feature.getStyle() !== null) {
              feature.setStyle(new Style(style_dalle.alert_limite));
          }
      });
      limit_dalle = true
  }
  else if (limit_dalle === true && dalles_select.length < limit_dalle_select) {
      vectorSourceGridDalle.getFeatures().forEach((feature) => {
          // si la dalle que l'on veut deselectionner est dans la liste des vecteurs de la page alors on enleve le style
          if (feature.getStyle() !== null) {
              feature.setStyle(new Style(style_dalle.select));
          }
      });
      limit_dalle = false
  }

  return limit_dalle
}

function style_dalle_select(
  feature,
  style_dalle,
  dalles_select,
  limit_dalle
) {
  // fonction permettant d'ajuster le style au survol d'une dalle
  // on parcout la liste des dalles selectionner
  for (const dalle_select of dalles_select) {
    // si la dalle est selectionner alors au survol on lui laisse le style select et on retourne true
    if (
      dalle_select["values_"]["properties"]["id"] ===
      feature["values_"]["properties"]["id"]
    ) {
      if (limit_dalle === true) {
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

export {eventSelectSurvol, alert_limit_dalle, eventSelectClick};
