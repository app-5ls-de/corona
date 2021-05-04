var cache = {};
function f(urls, callback, downloadFinished) {
  if (Array.isArray(urls)) {
    var array = urls;
  } else {
    var array = [urls];
  }
  Promise.all(
    array.map((url) => {
      if (cache[url]) {
        return Promise.resolve(cache[url]);
      } else {
        return fetch(url)
          .then((response) => {
            if (response.ok) {
              return Promise.resolve(response);
            } else {
              return Promise.reject(new Error(response.statusText));
            }
          })
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            if (url.startsWith(URL_host)) {
              cache[url] = response;
            }
            return response;
          });
      }
    })
  )
    .then((response) => {
      if (downloadFinished) downloadFinished();

      if (Array.isArray(urls)) {
        callback(response);
      } else {
        callback(response[0]);
      }
    })
    .catch((error) => {
      if (downloadFinished) downloadFinished();
      console.error("Request failed", error, urls);
    });
}

function mount(parent, childs) {
  if (childs.length) {
    childs.forEach((child) => {
      redom.mount(parent, child);
    });
  } else {
    redom.mount(parent, childs);
  }
}

function format(number) {
  // known SI prefixes
  /* var PREFIXES = {
        24: "Y",
        21: "Z",
        18: "E",
        15: "P",
        12: "T",
        9: "G",
        6: "M",
        3: "k",
        0: "",
        "-3": "m",
        "-6": "µ",
        "-9": "n",
        "-12": "p",
        "-15": "f",
        "-18": "a",
        "-21": "z",
        "-24": "y",
    }; */
  var PREFIXES = {
    6: "M",
    3: "k",
    0: "",
  };
  let maxExponent = Math.max(...Object.keys(PREFIXES).map(Number));

  function getExponent(n) {
    if (n === 0) {
      return 0;
    }
    return Math.floor(Math.log10(Math.abs(n)));
  }

  function precise(n) {
    return Number.parseFloat(n.toPrecision(3));
  }

  function toHumanString(sn) {
    // from https://www.npmjs.com/package/human-readable-numbers
    var n = precise(Number.parseFloat(sn));
    var e = Math.max(
      Math.min(3 * Math.floor(getExponent(n) / 3), maxExponent),
      -maxExponent
    );
    return precise(n / Math.pow(10, e)).toString() + PREFIXES[e];
  }

  if (Math.abs(number) >= 10000) return toHumanString(number);
  else return precise(number).toString();
}

var map = L.map("map", {
  zoomSnap: 0,
  zoomControl: false,
});

new L.Control.Zoom({ position: "bottomleft" }).addTo(map);

map.setView([51.33061163769853, 10.458984375000002], 6);

var data = {};
var selected = 0;

var switcher = L.control({ position: "topleft" });

switcher.onAdd = function () {
  this._div = redom.el(
    "div.info.switcher",
    redom.el(
      "div.buttons",
      redom.el("a", redom.el("button", redom.el("h4.label", "Graphen")), {
        href: "/graph",
      })
    )
  );

  return this._div;
};

switcher.update = function () {
  redom.setChildren(this._div, [
    redom.el(
      "div.buttons",
      redom.el("a", redom.el("button", redom.el("h4", "Graphen")), {
        href: "/graph",
      })
    ),
    redom.el("hr"),
    (this._selection_container = redom.el("div.selection-container")),
  ]);

  function handleClick(e) {
    let old_scope = config.series[selected].scope;
    let scope = config.series[this.value].scope;

    selected = this.value;
    locked = false;

    if (scope != old_scope) {
      if (scope == "districts") {
        draw(data.districts.geojson);
      } else {
        if (data[scope]) {
          draw(data[scope].geojson);
        } else {
          f(
            [config.scopes[scope].geojsonURL, config.scopes[scope].dataURL],
            (response) => {
              data[scope] = {
                geojson: response[0],
                data: response[1],
              };
              draw(data[scope].geojson);
              Layer.resetStyle();
              legend.update();
              region_info.update();
              info.update();
            }
          );
          return;
        }
      }
    }
    Layer.resetStyle();
    legend.update();
    region_info.update();
    info.update();
  }

  for (let i = 0; i < config.series.length; i++) {
    const element = config.series[i];

    redom.mount(
      this._selection_container,
      redom.el(
        "div.selection",
        redom.el("input", (el) => el.addEventListener("click", handleClick), {
          type: "radio",
          name: "selection",
          id: "selection-" + i,
          value: i,
          checked: i == selected,
        }),
        redom.el("label.label", element.name, {
          for: "selection-" + i,
        })
      )
    );
  }
};

var region_info = L.control({ position: "bottomright" });

region_info.onAdd = function () {
  this._div = redom.el("div.info.country_info");
  return this._div;
};

region_info.update = function () {
  let scope = config.series[selected].scope;
  redom.setChildren(this._div, []);
  if (scope == "world") {
    const world_data = data.world.data.OWID_WRL;
    mount(region_info._div, [
      redom.el("h4", "Weltweit"),
      createElToDisplay("Bevölkerung", world_data.population),
      createElToDisplay("Inzidenz", world_data.weekIncidence.toFixed(0)),
      createElToDisplay(
        "Infektionsrate",
        (world_data.casesRate * 100).toFixed(1) + "%"
      ),
      createElToDisplay(
        "Letalitätsrate",
        (world_data.deathRate * 100).toFixed(1) + "%"
      ),
      redom.el("div.date", new Date(world_data.date).toLocaleDateString()),
    ]);
  } else {
    const props = data.country.data;
    mount(region_info._div, [
      redom.el("h4", "Bundesweit"),
      createElToDisplay("Inzidenz", props.cases.weekIncidence.toFixed(0)),
      createElToDisplay(
        "Impffortschritt",
        (props.vaccinations.secondVaccination.quote * 100).toFixed(1) + "%"
      ),
      createElToDisplay("R-Wert", props.cases.r.value),
      createElToDisplay("Fälle", props.cases.cases, props.cases.delta.cases),
      createElToDisplay(
        "Impfungen",
        props.vaccinations.vaccinated,
        props.vaccinations.delta
      ),
      createElToDisplay(
        "Todesfälle",
        props.cases.deaths,
        props.cases.delta.deaths
      ),
      /* redom.el(
                "div.date",
                new Date(props.lastUpdate).toLocaleDateString()
            ), */
    ]);
  }
};

function createElToDisplay(label, value, delta) {
  let delta_el;
  if (delta != undefined) {
    let delta_text = "";
    if (delta >= 0) delta_text = " +" + format(delta);
    if (delta < 0) delta_text = " -" + format(-delta);
    delta_el = redom.el("div.delta", delta_text, {
      title: "Differenz zum Vortag",
    });
  }

  if (typeof value == "number") value = format(value);

  return redom.el(
    "div",
    redom.el("div.label", label + ": "),
    redom.el("div.value", value, delta_el),
    redom.el("br")
  );
}

function getValue(folder = config.series[selected].folder, id, key) {
  const scope = config.series[selected].scope;
  //const _folder = folder ? folder : config.series[selected].folder;
  //const key = _key ? _key : config.series[selected].key;

  if (data[scope] && data[scope].data[folder] && id) {
    let object = data[scope].data[folder][id];
    if (key && object) {
      return object[key];
    } else {
      return object;
    }
  }
  return null;
}

function style(feature) {
  color = "#a0a0a0";
  const value = getValue(
    undefined,
    feature.properties.id,
    config.series[selected].key
  );
  if (value) {
    config.series[selected].ranges.forEach((element) => {
      if (element.min <= value) {
        if (!element.max || value < element.max) color = element.color;
      }
    });
  }

  let options = {
    radius: 8,
    fillColor: color,
    color: color,
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9,
  };
  return options;
}

var locked = false;
var Layer;
function draw(geojson) {
  if (Layer) map.removeLayer(Layer);

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: lockHighlight,
    });
  }

  function highlightFeature(e) {
    if (locked) return;

    var layer = e.target;

    layer.setStyle({
      weight: 5,
      color: "#666",
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    info.update(layer.feature.properties.id);
  }

  function resetHighlight(e) {
    if (locked) return;
    Layer.resetStyle(e.target);

    info.update();
  }

  function lockHighlight(e) {
    console.log(e.target.feature);

    locked = false;
    Layer.resetStyle();
    highlightFeature(e);
    locked = true;
  }

  Layer = L.geoJSON(geojson, {
    onEachFeature: onEachFeature,
    style: style,
    attribution:
      '<a href="https://github.com/PatrickHaussmann/api.corona.app.5ls.de" target="_blank">Source</a> | ' +
      'Quellen: <a href="https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Fallzahlen.html/" target="_blank">RKI</a>, ' +
      '<a href="https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Projekte_RKI/Nowcasting.html" target="_blank">RKI</a>, ' +
      '<a href="https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Impfquoten-Tab.html" target="_blank">RKI</a>, ' +
      '<a href="https://github.com/owid/covid-19-data/tree/master/public/data" target="_blank">OWID</a>, ' +
      '<a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/dd4580c810204019a7b8eb3e0b329dd6_0/data" target="_blank">RKI</a>, ' +
      '<a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/ef4b445a53c1406892257fe63129a8ea_0/data" target="_blank">RKI</a>, ' +
      '<a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0/data" target="_blank">DIVI</a>',
  });
  Layer.addTo(map);

  Layer.resetStyle();
  map.fitBounds(Layer.getBounds().pad(0.02));
}

map._container.addEventListener("click", (e) => {
  if (map._container != e.target) return; // clicked on child
  locked = false;
  Layer.resetStyle();
  info.update();
});

var info = L.control();

info.onAdd = function (map) {
  this._div = redom.el("div.info.minwidth.infos");
  this.update();
  return this._div;
};

info.update = function (id) {
  if (id) {
    this._div.style.display = "";
    redom.setChildren(this._div, []);
    let scope = config.series[selected].scope;
    if (scope == "districts") {
      let el_graph;
      const history = getValue("incidence", id, "history");
      if (history) {
        let array = [];
        history.forEach((element) => {
          array.push(element.weekIncidence);
        });

        let max = Math.max(...array);

        let el_area_tbody = redom.el("tbody");

        let last = null;
        array.forEach((element) => {
          let value = element / max;
          if (last) {
            el_area_tbody.appendChild(
              redom.el(
                "tr",
                redom.el("td", {
                  style: "--start: " + last + "; --size: " + value,
                })
              )
            );
          }

          last = value;
        });

        let incidence_markers = [100, 150, 165].filter((value) => value < max);

        let el_line_tr = redom.el("tr");
        let el_line_tbody = redom.el("tbody", el_line_tr);

        incidence_markers.forEach((element) => {
          let value = element / max;

          el_line_tr.appendChild(
            redom.el("td", {
              style: "--start: " + value + "; --size: " + value,
            })
          );
        });

        el_graph = redom.el("div.chart", [
          redom.el("table.charts-css.area", el_area_tbody),
          redom.el("table.charts-css.line", el_line_tbody),
        ]);
      }
      const props = {
        incidence: getValue("incidence", id),
        cases: getValue("cases", id),
        divi: getValue("divi", id),
      };
      mount(this._div, [
        props.incidence && redom.el("h4", props.incidence.name),
        props.incidence &&
          createElToDisplay(
            "Inzidenz",
            props.incidence.weekIncidence.toFixed(0)
          ),
        props.cases &&
          createElToDisplay(
            "Infektionsrate",
            (props.cases.casesRate * 100).toFixed(1) + "%"
          ),
        props.cases &&
          createElToDisplay(
            "Letalitätsrate",
            (props.cases.deathRate * 100).toFixed(1) + "%"
          ),
        props.cases &&
          createElToDisplay(
            "Fälle",
            props.cases.cases,
            props.cases.delta.cases
          ),
        props.cases &&
          createElToDisplay(
            "Todesfälle",
            props.cases.deaths,
            props.cases.delta.deaths
          ),
        props.cases && createElToDisplay("Bevölkerung", props.cases.population),
        props.divi &&
          createElToDisplay(
            "Freie Intensivbetten",
            (props.divi.proportionBedsAvailable * 100).toFixed(0) + "%"
          ),
        props.divi &&
          createElToDisplay(
            "Intensivbetten mit Covid",
            (props.divi.proportionBedsCovid * 100).toFixed(0) + "%"
          ),
        el_graph &&
          redom.el(
            "div.chart-container",
            redom.el("h4", "Inzidenz letzte 7 Tage:"),
            el_graph,
            redom.el("div.label", "Linien bei 100, 150, 165")
          ),
      ]);
    } else if (scope == "states") {
      const props = {
        cases: getValue("cases", id),
        vaccinations: getValue("vaccinations", id),
      };
      mount(this._div, [
        redom.el("h4", props.cases.name),
        createElToDisplay("Inzidenz", props.cases.weekIncidence.toFixed(0)),
        createElToDisplay(
          "Infektionsrate",
          (props.cases.casesRate * 100).toFixed(1) + "%"
        ),
        createElToDisplay(
          "Letalitätsrate",
          (props.cases.deathRate * 100).toFixed(1) + "%"
        ),
        createElToDisplay(
          "Impffortschritt",
          (props.vaccinations.secondVaccination.quote * 100).toFixed(1) + "%"
        ),
        createElToDisplay("Fälle", props.cases.cases, props.cases.delta.cases),
        createElToDisplay(
          "Todesfälle",
          props.cases.deaths,
          props.cases.delta.deaths
        ),
        createElToDisplay("Bevölkerung", props.cases.population),
        /* redom.el(
          "div.date",
          new Date(data.states.data.lastUpdate).toLocaleDateString()
        ), */
      ]);
    } else if (scope == "world") {
      const props = {
        world: getValue("cases", id),
      };
      mount(
        this._div,
        [
          redom.el("h4", props.world.location),
          createElToDisplay(
            "Inzidenz",
            props.world.weekIncidence && props.world.weekIncidence.toFixed(0)
          ),
          createElToDisplay(
            "Infektionsrate",
            props.world.casesRate &&
              (props.world.casesRate * 100).toFixed(1) + "%"
          ),
          createElToDisplay(
            "Letalitätsrate",
            props.world.deathRate &&
              (props.world.deathRate * 100).toFixed(1) + "%"
          ),
          createElToDisplay("Bevölkerung", props.world.population),
          props.world.people_vaccinated_per_hundred &&
            createElToDisplay(
              "Impffortschritt",
              props.world.people_vaccinated_per_hundred.toFixed(1) + "%"
            ),
          /* redom.el("div.date", new Date(props.world.date).toLocaleDateString()), */
        ].filter((el) => el)
      );
    }
  } else {
    this._div.style.display = "none";
    redom.setChildren(this._div, []);
  }
};

info.addTo(map);

var legend = L.control({ position: "bottomleft" });

legend.onAdd = function (map) {
  this._div = redom.el("div.info.legend");
  this.update();

  return this._div;
};

legend.update = function () {
  redom.setChildren(this._div, []);
  let format = (a) => a;
  if (config.series[selected].unit == "%")
    format = (a) => (a * 100).toFixed(1) + " %";
  config.series[selected].ranges.forEach((element) => {
    if (element.min !== undefined) {
      if (element.max) {
        text = "<" + format(element.max);
      } else {
        text = ">" + format(element.min);
      }
      mount(this._div, [
        redom.el("div.colorSquare", {
          style: "background-color:" + element.color + ";",
        }),
        redom.el("span", text),
        redom.el("br"),
      ]);
    }
  });
};

legend.addTo(map);
switcher.addTo(map);

function getStateAbbreviationById(id) {
  switch (id) {
    case 1:
      return "SH";
    case 2:
      return "HH";
    case 3:
      return "NI";
    case 4:
      return "HB";
    case 5:
      return "NW";
    case 6:
      return "HE";
    case 7:
      return "RP";
    case 8:
      return "BW";
    case 9:
      return "BY";
    case 10:
      return "SL";
    case 11:
      return "BE";
    case 12:
      return "BB";
    case 13:
      return "MV";
    case 14:
      return "SN";
    case 15:
      return "ST";
    case 16:
      return "TH";
    default:
      return null;
  }
}

// Stage 1
f(
  [
    config.scopes.districts.geojsonURL,
    URL_api + "/districts/history/frozen-incidence/7",
  ],
  (response) => {
    data.districts = {
      geojson: response[0],
      data: { incidence: response[1].data },
    };

    for (const key in data.districts.data.incidence) {
      if (Object.hasOwnProperty.call(data.districts.data.incidence, key)) {
        const element = data.districts.data.incidence[key];
        element.weekIncidence =
          element.history[element.history.length - 1].weekIncidence;
      }
    }

    document.getElementById("spinner").style.display = "none";
    draw(data.districts.geojson);
  },
  () => {
    // Stage 2
    f(
      [URL_api + "/districts", URL_host + "/districts_beds"],
      (response) => {
        data.districts.data.cases = response[0].data;
        data.districts.data.divi = response[1].data;

        for (const ags in data.districts.data.cases) {
          if (Object.hasOwnProperty.call(data.districts.data.cases, ags)) {
            const district = data.districts.data.cases[ags];

            if (district.population != null && district.cases != null)
              district.casesRate = district.cases / district.population;
            if (district.cases != null && district.deaths != null)
              district.deathRate = district.deaths / district.cases;
          }
        }
      },
      () => {
        // Stage 3
        f(
          [URL_api + "/germany", URL_api + "/vaccinations"],
          (response) => {
            data.country = {
              data: {
                cases: response[0],
                vaccinations: response[1].data,
              },
            };
            data.country.data.vaccinations.states = undefined;

            const population = 83783945;

            const cases = data.country.data.cases;
            if (population != null && cases.cases != null)
              cases.casesRate = cases.cases / population;
            if (cases.cases != null && cases.deaths != null)
              cases.deathRate = cases.deaths / cases.cases;

            //data.country.data.vaccinations = response[1].data["BUND"]
            region_info.addTo(map);
            region_info.update();
          },
          () => {
            // Stage 4
            f(
              [
                config.scopes.states.geojsonURL,
                URL_api + "/states",
                URL_api + "/vaccinations",
                URL_host + "/world",
                config.scopes.world.geojsonURL,
              ],
              (response) => {
                data.states = {
                  geojson: response[0],
                  data: {
                    cases: response[1].data,
                    vaccinations: response[2].data.states,
                  },
                };

                data.states.geojson.features.forEach((state) => {
                  state.properties.id = getStateAbbreviationById(
                    parseFloat(state.properties.id)
                  );
                });

                for (const key in data.states.data.cases) {
                  if (Object.hasOwnProperty.call(data.states.data.cases, key)) {
                    const state = data.states.data.cases[key];

                    if (state.population != null && state.cases != null)
                      state.casesRate = state.cases / state.population;
                    if (state.cases != null && state.deaths != null)
                      state.deathRate = state.deaths / state.cases;
                  }
                }

                delete data.states.data.vaccinations["Bund"];

                for (const state in data.states.data.vaccinations) {
                  if (
                    Object.hasOwnProperty.call(
                      data.states.data.vaccinations,
                      state
                    )
                  ) {
                    const element = data.states.data.vaccinations[state];
                    element.secondVaccinationQuote =
                      element.secondVaccination.quote;
                  }
                }

                data.world = {
                  data: {
                    cases: response[3],
                  },
                  geojson: response[4],
                };
                switcher.update();
              }
            );
          }
        );
      }
    );
  }
);
