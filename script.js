function f(url, callback) {
    fetch(url)
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
        .then(callback)
        .catch((error) => {
            console.error("Request failed", error, url);
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

var map = L.map("map", {
    zoomSnap: 0,
    zoomControl: false,
});

new L.Control.Zoom({ position: "bottomleft" }).addTo(map);

map.setView([51.33061163769853, 10.458984375000002], 6);

var URL_host = "https://api.corona.app.5ls.de";

var URL_data = URL_host + "/districts";
var URL_geojson = URL_host + "/districts.geojson";
var URL_country = URL_host + "/country";

var data;
var geojson;
var selected_series;

f(URL_geojson, (response) => {
    geojson = response;
    if (data) draw();
});

f(URL_data, (response) => {
    data = response;
    if (geojson) draw();
});

var country_info = L.control({ position: "bottomright" });

country_info.onAdd = function (map) {
    this._div = redom.el("div.info.country_info");
    return this._div;
};

country_info.addTo(map);

f(URL_country, (response) => {
    mount(country_info._div, [
        redom.el("h4", "Bundesweit"),
        createElToDisplay("Fälle", response.cases, response.delta.cases),
        createElToDisplay("Todesfälle", response.deaths, response.delta.deaths),
        createElToDisplay("R-Wert", response.rValue),
        createElToDisplay("Inzidenz", response.weekIncidence.toFixed(0)),
        redom.el(
            "div.date",
            new Date(response.lastUpdate).toLocaleDateString() + " (8:30Uhr)",
            {
                title: "Daten von 0Uhr, veröffentlicht um 8:30Uhr",
            }
        ),
    ]);
});

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
    if (!feature.data) return;

    let selected_series = "weekIncidence";

    value = feature.data[selected_series];

    config[selected_series].ranges.forEach((element) => {
        if (element.min <= value) {
            if (!element.max || value < element.max) color = element.color;
        }
    });

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
function draw() {
    document.getElementById("spinner").style.display = "none";

    selected_series = "weekIncidence";

    function onEachFeature(feature, layer) {
        feature.data = data.data[feature.properties.rs];

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
        console.log(e.target.feature.data);

        locked = false;
        Layer.resetStyle();
        highlightFeature(e);
        locked = true;

        var layer = e.target;
    }

    Layer = L.geoJSON(geojson, {
        onEachFeature: onEachFeature,
        style: style,
        attribution:
            'Quellen: <a href="https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Fallzahlen.html/" target="_blank">RKI</a>, \
        <a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0/data" target="_blank">RKI</a>, \
        <a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/8fc79b6cf7054b1b80385bda619f39b8_0/data" target="_blank">DIVI</a>',
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
        mount(this._div, [
            redom.el("h4", props.name),
            createElToDisplay("Fälle", props.cases, props.delta.cases),
            createElToDisplay("Todesfälle", props.deaths, props.delta.deaths),
            createElToDisplay("Bevölkerung", props.population),
            createElToDisplay("Inzidenz", props.weekIncidence.toFixed(0)),
            createElToDisplay(
                "Betroffenenrate",
                (props.casesRate * 100).toFixed(1) + "%"
            ),
            createElToDisplay(
                "Sterberate",
                (props.deathRate * 100).toFixed(1) + "%"
            ),
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
                new Date(data.lastUpdate).toLocaleDateString() +
                    " (" +
                    new Date(data.lastUpdate).toLocaleTimeString().slice(0, 4) +
                    "Uhr)"
            ),
        ]);
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
    let selected_series = "weekIncidence";
    config[selected_series].ranges.forEach((element) => {
        if (element.min != undefined) {
            if (element.max) {
                text = "<" + element.max;
            } else {
                text = ">" + element.min;
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

var switcher = L.control({ position: "topleft" });

switcher.onAdd = function (map) {
    this._div = redom.el(
        "div.info.switcher",
        (this._a_graph = redom.el("a", "Graph", { href: "/graph" }))
    );

    return this._div;
};

switcher.addTo(map);
