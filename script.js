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
                            return Promise.reject(
                                new Error(response.statusText)
                            );
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
            redom.el("a", redom.el("button", redom.el("h4", "Graphen")), {
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
                        [
                            config.scopes[scope].geojsonURL,
                            config.scopes[scope].dataURL,
                        ],
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
                redom.el(
                    "input",
                    (el) => el.addEventListener("click", handleClick),
                    {
                        type: "radio",
                        name: "selection",
                        id: "selection-" + i,
                        value: i,
                        checked: i == selected,
                    }
                ),
                redom.el("label", element.name, {
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
            redom.el(
                "div.date",
                new Date(world_data.date).toLocaleDateString()
            ),
        ]);
    } else {
        mount(region_info._div, [
            redom.el("h4", "Bundesweit"),
            createElToDisplay(
                "Inzidenz",
                data.country.weekIncidence.toFixed(0)
            ),
            createElToDisplay(
                "Impffortschritt",
                (data.country.secondVaccinationQuote * 100).toFixed(1) + "%"
            ),
            createElToDisplay("R-Wert", data.country.rValue),
            createElToDisplay(
                "Fälle",
                data.country.cases,
                data.country.delta.cases
            ),
            createElToDisplay(
                "Impfungen",
                data.country.vaccinated,
                data.country.delta.vaccinated
            ),
            createElToDisplay(
                "Todesfälle",
                data.country.deaths,
                data.country.delta.deaths
            ),
            redom.el(
                "div.date",
                new Date(data.country.lastUpdate).toLocaleDateString()
            ),
        ]);
    }
};

function createElToDisplay(label, value, delta) {
    let delta_el;
    if (delta != undefined) {
        let delta_text = "";
        if (delta >= 0) delta_text = " +" + delta;
        if (delta < 0) delta_text = " -" + delta;
        delta_el = redom.el("div.delta", delta_text, {
            title: "Differenz zum Vortag",
        });
    }

    return redom.el(
        "div",
        redom.el("div.label", label + ": "),
        redom.el("div.value", value, delta_el),
        redom.el("br")
    );
}

function style(feature) {
    color = "#a0a0a0";
    if (feature.data) {
        value = feature.data[config.series[selected].key];

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
        let scope = config.series[selected].scope;
        if (scope == "districts") {
            feature.data = data.districts.data.districts[feature.properties.rs];
        } else if (scope == "states") {
            feature.data = data.states.data.states[feature.properties.name];
        } else if (scope == "world") {
            feature.data = data.world.data[feature.properties.adm0_a3_is];
        }

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

        info.update(layer.feature.data);
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

info.update = function (props) {
    if (props) {
        this._div.style.display = "";
        redom.setChildren(this._div, []);
        let scope = config.series[selected].scope;
        if (scope == "districts") {
            mount(this._div, [
                redom.el("h4", props.name),
                createElToDisplay("Inzidenz", props.weekIncidence.toFixed(0)),
                createElToDisplay(
                    "Infektionsrate",
                    (props.casesRate * 100).toFixed(1) + "%"
                ),
                createElToDisplay(
                    "Letalitätsrate",
                    (props.deathRate * 100).toFixed(1) + "%"
                ),
                createElToDisplay("Fälle", props.cases, props.delta.cases),
                createElToDisplay(
                    "Todesfälle",
                    props.deaths,
                    props.delta.deaths
                ),
                createElToDisplay("Bevölkerung", props.population),
                createElToDisplay(
                    "Freie Intensivbetten",
                    (props.proportionBedsAvailable * 100).toFixed(0) + "%"
                ),
                createElToDisplay(
                    "Intensivbetten mit Covid",
                    (props.proportionBedsCovid * 100).toFixed(0) + "%"
                ),
                redom.el(
                    "div.date",
                    new Date(
                        data.districts.data.lastUpdate
                    ).toLocaleDateString()
                ),
            ]);
        } else if (scope == "states") {
            mount(this._div, [
                redom.el("h4", props.name),
                createElToDisplay("Inzidenz", props.weekIncidence.toFixed(0)),
                createElToDisplay(
                    "Infektionsrate",
                    (props.casesRate * 100).toFixed(1) + "%"
                ),
                createElToDisplay(
                    "Letalitätsrate",
                    (props.deathRate * 100).toFixed(1) + "%"
                ),
                createElToDisplay(
                    "Impffortschritt",
                    (props.secondVaccinationQuote * 100).toFixed(1) + "%"
                ),
                createElToDisplay("Fälle", props.cases, props.delta.cases),
                createElToDisplay(
                    "Todesfälle",
                    props.deaths,
                    props.delta.deaths
                ),
                createElToDisplay("Bevölkerung", props.population),
                redom.el(
                    "div.date",
                    new Date(data.states.data.lastUpdate).toLocaleDateString()
                ),
            ]);
        } else if (scope == "world") {
            mount(
                this._div,
                [
                    redom.el("h4", props.location),
                    createElToDisplay(
                        "Inzidenz",
                        props.weekIncidence && props.weekIncidence.toFixed(0)
                    ),
                    createElToDisplay(
                        "Infektionsrate",
                        props.casesRate &&
                            (props.casesRate * 100).toFixed(1) + "%"
                    ),
                    createElToDisplay(
                        "Letalitätsrate",
                        props.deathRate &&
                            (props.deathRate * 100).toFixed(1) + "%"
                    ),
                    createElToDisplay("Bevölkerung", props.population),
                    props.people_vaccinated_per_hundred &&
                        createElToDisplay(
                            "Impffortschritt",
                            props.people_vaccinated_per_hundred.toFixed(1) + "%"
                        ),
                    redom.el(
                        "div.date",
                        new Date(props.date).toLocaleDateString()
                    ),
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
        if (element.min != undefined) {
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

// Stage 1
f(
    [config.scopes.districts.geojsonURL, config.scopes.districts.dataURL],
    (response) => {
        data.districts = {
            geojson: response[0],
            data: response[1],
        };
        document.getElementById("spinner").style.display = "none";
        draw(data.districts.geojson);
    },
    () => {
        // Stage 2
        f(
            URL_host + "/country",
            (response) => {
                data.country = response;
                region_info.addTo(map);
                region_info.update();
            },
            () => {
                // Stage 3
                let urlsToCache = [URL_host + "/world", URL_host + "/states"];
                f(urlsToCache, (response) => {
                    console.log("cached:", urlsToCache);
                    switcher.update();
                });
            }
        );
    }
);
