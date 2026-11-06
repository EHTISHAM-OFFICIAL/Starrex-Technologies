// Regenerates "Starrex Technologies/assets/data/continents.js" (7 continents from Natural Earth 110m).
// Usage: npm i world-atlas topojson-client d3-geo countries-list world-countries polygon-clipping
//        node tools/build-continents.mjs   (writes ./continents.js; copy it into assets/data/)

import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const topojson = require("topojson-client");
const pc = require("polygon-clipping");
const countriesList = require("countries-list");
const wc = require("world-countries");

const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const geoms = topo.objects.countries.geometries;

const numToA2 = new Map(wc.map((c) => [c.ccn3, c.cca2]));
const contName = { AF: "Africa", AN: "Antarctica", AS: "Asia", EU: "Europe", NA: "North America", OC: "Oceania", SA: "South America" };
const groups = { AF: [], AN: [], AS: [], EU: [], NA: [], OC: [], SA: [] };
let russia = null;
const unknown = [];

for (const g of geoms) {
  const name = g.properties && g.properties.name;
  let code;
  if (name === "Russia") { russia = g; continue; }
  if (name === "Kosovo" || name === "N. Cyprus") code = "EU";
  else if (name === "Somaliland") code = "AF";
  else {
    const a2 = numToA2.get(String(g.id).padStart(3, "0"));
    code = a2 && countriesList.countries[a2] ? countriesList.countries[a2].continent : null;
  }
  if (!code || !groups[code]) { unknown.push(name); continue; }
  groups[code].push(g);
}
console.log("unmapped:", unknown);

const merged = {};
for (const k of Object.keys(groups)) merged[k] = topojson.merge(topo, groups[k]);

// Split Russia at the Urals (~60E): west -> Europe, rest -> Asia.
// The mainland polygon crosses the antimeridian, so unwrap longitudes before clipping.
const ru = topojson.merge(topo, [russia]);
const box = (w, e) => [[[w, -90], [e, -90], [e, 90], [w, 90], [w, -90]]];
// polygon-clipping returns GeoJSON winding; d3 wants the opposite, so reverse every ring
const flip = (polys) => polys.map((poly) => poly.map((ring) => ring.slice().reverse()));
const west = [];
const east = [];
for (const poly of ru.coordinates) {
  const lons = poly[0].map((p) => p[0]);
  const minL = Math.min(...lons);
  const maxL = Math.max(...lons);
  if (minL >= 0 && maxL <= 60) { west.push(poly); continue; }
  if (minL >= 60 || maxL <= 0) { east.push(poly); continue; }
  const unwrapped = poly.map((ring) => ring.map(([x, y]) => [x < 0 ? x + 360 : x, y]));
  west.push(...flip(pc.intersection([unwrapped], box(0, 60))));
  east.push(...flip(pc.intersection([unwrapped], box(60, 400))));
}
merged.EU = { type: "MultiPolygon", coordinates: [...merged.EU.coordinates, ...west] };
merged.AS = { type: "MultiPolygon", coordinates: [...merged.AS.coordinates, ...east] };

const r = (n) => Math.round(n * 100) / 100;
const round = (c) => (typeof c[0] === "number" ? [r(c[0]), r(c[1])] : c.map(round));

const features = Object.keys(merged).map((k) => ({
  type: "Feature",
  properties: { code: k, name: contName[k] },
  geometry: { type: "MultiPolygon", coordinates: round(merged[k].coordinates) },
}));
const out = "/* Natural Earth 110m land, grouped into the 7 continents (Russia split at the Urals).\n   Built from the world-atlas npm package. */\nwindow.STARREX_CONTINENTS = " + JSON.stringify({ type: "FeatureCollection", features }) + ";\n";
fs.writeFileSync("continents.js", out);
console.log("features:", features.map((f) => f.properties.name + ":" + f.geometry.coordinates.length).join(", "));
console.log("bytes:", out.length);

