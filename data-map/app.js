const mapData = window.ATTACK_MAP_DATA;
const weaponStyles = {
  "Ballistic Missile": { color: "#c65d45", short: "Ballistic" },
  "Cruise Missile": { color: "#3d7d82", short: "Cruise" },
  "Loitering Munition": { color: "#d49b36", short: "Loitering" },
  "SAM": { color: "#698252", short: "Surface-to-air" }
};
const offsets = {
  "Ballistic Missile": [0.09, -0.12],
  "Cruise Missile": [0.09, 0.12],
  "Loitering Munition": [-0.09, -0.12],
  "SAM": [-0.09, 0.12]
};
const numberFormat = new Intl.NumberFormat("en-US");
let activeMetric = "weapons_reported";
const activeWeapons = new Set(Object.keys(weaponStyles));
const bubbleLayer = L.layerGroup();
const map = L.map("attack-map", { attributionControl: false, scrollWheelZoom: false, minZoom: 5, maxZoom: 8 });

const oblastLayer = L.geoJSON(mapData.oblasts, {
  style: { color: "#849397", weight: 1, fillColor: "#e5e6df", fillOpacity: 1 },
  onEachFeature(feature, layer) {
    layer.bindTooltip(feature.properties.name_en || feature.properties.name, { sticky: true });
    layer.on({ mouseover: () => layer.setStyle({ fillColor: "#d7ddd0", weight: 1.5 }), mouseout: () => oblastLayer.resetStyle(layer) });
  }
}).addTo(map);
map.fitBounds(oblastLayer.getBounds(), { padding: [12, 12] });
bubbleLayer.addTo(map);

function metricLabel() { return activeMetric === "weapons_reported" ? "weapons reported" : "attack reports"; }
function renderBubbles() {
  bubbleLayer.clearLayers();
  const points = mapData.points.filter(point => activeWeapons.has(point.weapon));
  const maximum = Math.max(...points.map(point => point[activeMetric]), 0);
  points.forEach(point => {
    const [latOffset, lngOffset] = offsets[point.weapon];
    const radius = maximum ? 4 + Math.sqrt(point[activeMetric] / maximum) * 23 : 0;
    L.circleMarker([point.latitude + latOffset, point.longitude + lngOffset], {
      radius, color: "#34444c", weight: 1, fillColor: weaponStyles[point.weapon].color, fillOpacity: 0.78
    }).bindPopup(`<div class="map-popup"><span>${point.weapon}</span><strong>${point.oblast} Oblast</strong><span>${numberFormat.format(point[activeMetric])} ${metricLabel()}</span></div>`).addTo(bubbleLayer);
  });
}

document.querySelector("#weapon-filters").innerHTML = Object.entries(weaponStyles).map(([weapon, style]) =>
  `<button class="data-map-filter" type="button" data-weapon="${weapon}" aria-pressed="true" style="--weapon-color:${style.color}"><span class="data-map-swatch"></span>${style.short}</button>`
).join("");
document.querySelectorAll(".data-map-filter").forEach(button => button.addEventListener("click", () => {
  const weapon = button.dataset.weapon;
  if (activeWeapons.has(weapon) && activeWeapons.size > 1) activeWeapons.delete(weapon); else activeWeapons.add(weapon);
  button.setAttribute("aria-pressed", String(activeWeapons.has(weapon)));
  renderBubbles();
}));
document.querySelectorAll(".data-map-button").forEach(button => button.addEventListener("click", () => {
  activeMetric = button.dataset.metric;
  document.querySelectorAll(".data-map-button").forEach(item => item.classList.toggle("active", item === button));
  renderBubbles();
}));
renderBubbles();
window.addEventListener("resize", () => map.invalidateSize());