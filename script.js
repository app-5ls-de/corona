function f(url, callback) {
    fetch(url)
        .then((response) => {
            if (response.ok) {
                return Promise.resolve(response)
            } else {
                return Promise.reject(new Error(response.statusText))
            }
        })
        .then((response) => {
            return response.json()
        })
        .then(callback)
        .catch((error) => {
            console.error('Request failed', error, url)
        })
}

function mount(parent, childs) {
    if (childs.length) {
        childs.forEach(child => {
            redom.mount(parent, child)
        })
    } else {
        redom.mount(parent, childs)
    }
}

var map = L.map('map', {
    zoomSnap: 0,
    zoomControl: false
})

new L.Control.Zoom({ position: 'bottomleft' }).addTo(map);

map.setView([51.33061163769853, 10.458984375000002], 6)



var URL_host = "https://api.corona.app.5ls.de"

var URL_data = URL_host + "/districts"
var URL_geojson = URL_host + "/districts.geojson"
var URL_country = URL_host + "/country"

var data
var geojson
var selected_series



f(URL_geojson, (response) => {
    geojson = response
    if (data) draw()
})

f(URL_data, (response) => {
    districts = {}
    response.districts.forEach(element => {
        districts[element.rs] = element
    })
    data = response
    data.districts = districts
    if (geojson) draw()
})


var country_info = L.control({ position: 'bottomright' })

country_info.onAdd = function (map) {
    this._div = redom.el("div.info")
    return this._div
}

country_info.addTo(map)

f(URL_country, (response) => {
    mount(country_info._div, [redom.el("h4", "Bundesweit"), createElToDisplay("diff. Vortag", "+" + response.difference_to_previous_date), createElToDisplay("Inzidenz", response.week_incidence.toFixed(0)), redom.el("div.date", response.last_update + " (8:30Uhr)", { title: "Daten von 0Uhr, veröffentlicht um 8:30Uhr" })])
})

function createElToDisplay(label, value) {
    return redom.el("div", redom.el("div.label", label + ": "), redom.el("div.value", value), redom.el("br"))
}



function style(feature) {
    //color = "#a0a0a0"
    if (!feature.data) return

    series = data.series[selected_series]
    colors = series.color

    value = feature.data[selected_series]

    colors.forEach(element => {
        if (element.range_start <= value) {
            if (!element.range_end || value < element.range_end)
                color = element.hex
        }
    });



    let options = {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9
    }
    return options
}


var switcher = L.control({ position: 'topleft' })

var locked = false
var Layer
function draw() {
    document.getElementById("spinner").style.display = "none"

    selected_series = Object.keys(data.series)[0]
    if (Object.keys(data.series).includes("week_incidence")) {
        selected_series = "week_incidence"
    }

    legend.update()

    switcher.onAdd = function (map) {
        let options = []
        for (const serie in data.series) {
            if (Object.hasOwnProperty.call(data.series, serie)) {
                options.push(redom.el("option", serie, { value: serie, selected: serie == "week_incidence" }))
            }
        }

        this._div = redom.el("div.info.switcher", this.selector = redom.el("select", options))

        this._div.addEventListener("change", (e) => {
            selected_series = this.selector.value

            plausible('switcher', { props: { selected: selected_series } })
            Layer.resetStyle()
            legend.update()
        })

        return this._div
    }

    switcher.addTo(map)



    function onEachFeature(feature, layer) {
        feature.data = data.districts[feature.properties.rs]

        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: lockHighlight
        })
    }

    function highlightFeature(e) {
        if (locked) return

        var layer = e.target

        layer.setStyle({
            weight: 5,
            color: '#666'
        })

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront()
        }

        info.update(layer.feature.data)
    }

    function resetHighlight(e) {
        if (locked) return
        Layer.resetStyle(e.target)

        info.update()
    }

    function lockHighlight(e) {
        locked = false
        Layer.resetStyle()
        highlightFeature(e)
        locked = true
    }

    Layer = L.geoJSON(geojson, {
        onEachFeature: onEachFeature,
        style: style,
        attribution: 'Quellen: <a href="https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Fallzahlen.html/" target="_blank">RKI</a>, \
        <a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0/data" target="_blank">RKI</a>, \
        <a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/8fc79b6cf7054b1b80385bda619f39b8_0/data" target="_blank">DIVI</a>'
    })
    Layer.addTo(map)

    Layer.resetStyle()
    map.fitBounds(Layer.getBounds().pad(0.02))
}


map._container.addEventListener("click", (e) => {
    if (map._container != e.target) return // clicked on child
    locked = false
    Layer.resetStyle()
    info.update()
})

var info = L.control()

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info minwidth')
    this.update()
    return this._div
}

info.update = function (props) {
    if (props) {
        this._div.style.display = ""
        redom.setChildren(this._div, []);
        mount(this._div, [redom.el("h4", props.name), createElToDisplay("Fälle", props.cases), createElToDisplay("Tode", props.deaths), createElToDisplay("Bevölkerung", props.population), createElToDisplay("Inzidenz", props.week_incidence.toFixed(0)), createElToDisplay("Betroffenenrate", props.cases_rate.toFixed(1) + "%"), createElToDisplay("Sterberate", props.death_rate.toFixed(1) + "%"), redom.el("hr"),
        createElToDisplay("Betten frei", props.beds_available),
        createElToDisplay("Betten belegt", props.beds_occupied),
        createElToDisplay("Betten gesamt", props.beds_total),
        createElToDisplay("Fälle Covid aktuell", props.beds_covid),
        createElToDisplay("Fälle Covid aktuell beatmet", props.beds_covid_ventilated),
        createElToDisplay("Anteil freier Betten", props.proportion_beds_available + "%"),
        createElToDisplay("Anteil Covid Betten", props.proportion_beds_covid + "%"),
        createElToDisplay("Anteil Covid beatmet", props.proportion_beds_covid_ventilated + "%"),
        redom.el("div.date", data.last_update)
        ])
    } else {
        this._div.style.display = "none"
        redom.setChildren(this._div, []);
    }
}

info.addTo(map)



var legend = L.control({ position: 'bottomleft' })

legend.onAdd = function (map) {
    this._div = redom.el("div.info.legend")
    this.update()

    return this._div
}

legend.update = function () {
    if (!data) return
    series = data.series[selected_series]
    colors = series.color

    redom.setChildren(this._div, []);
    colors.forEach(element => {
        if (element.range_start != undefined) {
            if (element.range_end) {
                text = "<" + element.range_end
            } else {
                text = ">" + element.range_start
            }
            mount(this._div, [redom.el("div.colorSquare", { style: "background-color:" + element.hex + ";" }), redom.el("span", text), redom.el("br")])
        }
    });
}

legend.addTo(map)


