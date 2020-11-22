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
            console.log('Request failed', error)
        })
}


var map = L.map('map', {
    zoomSnap: 0
})


var style = "weekIncidence"
//var style = "casesPer100k"
//var style = "intensivbetten"

function styleSwitch(e) {
    if (!["weekIncidence", "casesPer100k", "intensivbetten"].includes(e.id)) return
    style = e.id
    switcher.addTo(map)
    legend.addTo(map)
    Layer.resetStyle()

    if (style == "intensivbetten" && !intensivbetten) {
        f(URL_intensivbetten, (data) => {
            intensivbetten = {
                lastUpdate: data.lastUpdate,
                districts: {}
            }

            data.districts.forEach(element => {
                intensivbetten.districts[element.county] = element
            })

            Layer.resetStyle()
        })
    }
}

var switcher = L.control({ position: 'topleft' })

switcher.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info switcher')
    this._div.classList.add(style)

    this._div.innerHTML = '<button onclick="styleSwitch(this)" id="weekIncidence" class="weekIncidence">Inzidenz</button>' +
        '<button onclick="styleSwitch(this)" id="casesPer100k" class="casesPer100k">Fälle/100k</button>' +
        '<button onclick="styleSwitch(this)" id="intensivbetten" class="intensivbetten">Intensivbetten</button>' +
        '<button onclick="location.href=' + "'/timeline'" + '" id="timeline" class="timeline">Timeline</button>'

    return this._div
}

switcher.addTo(map)

var locked = false

var Layer
function draw() {
    document.getElementById("spinner").style.display = "none"


    function onEachFeature(feature, layer) {
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

        info.update(layer.feature.properties)
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
        style: function (feature) {
            color = "#a0a0a0"
            id = getId(feature)
            feature.properties.cases = cases.states[id]

            if (style == "casesPer100k") {
                casesPer100k = feature.properties.cases.casesPer100k

                if (casesPer100k == undefined || casesPer100k == null) {
                    casesPer100k = -1
                }

                if (casesPer100k < 0) color = "#a0a0a0"
                else if (casesPer100k < 300) color = "#c5c8d2"
                else if (casesPer100k < 600) color = "#a4b5c5"
                else if (casesPer100k < 900) color = "#84a8ba"
                else if (casesPer100k < 1200) color = "#5c91b1"
                else if (casesPer100k < 1600) color = "#2d6e9d"
                else color = "#0c4783"

            } else if (style == "weekIncidence") {
                weekIncidence = feature.properties.cases.weekIncidence

                if (weekIncidence == undefined || weekIncidence == null) {
                    weekIncidence = -1
                }

                if (weekIncidence < 0) color = "#a0a0a0"
                else if (weekIncidence < 35) color = "#d2cd84"
                else if (weekIncidence < 50) color = "#c6941a"
                else if (weekIncidence < 100) color = "#bb5220"
                else if (weekIncidence < 200) color = "#af2632"
                else color = "#8c0619"
            } else if (style == "intensivbetten") {
                if (intensivbetten) {
                    let district = intensivbetten.districts[id]
                    if (district) {
                        feature.properties.intensivbetten = district

                        let anteil_freier_betten = district.anteil_freier_betten
                        if (anteil_freier_betten < 0) color = "#a0a0a0"
                        else if (anteil_freier_betten < 10) color = "#c63520"
                        else if (anteil_freier_betten < 25) color = "#d19443"
                        else color = "#338c06"
                    }
                }
            }

            let options = {
                radius: 8,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.9
            }
            return options
        },
        attribution: 'Quellen: <a href="https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Fallzahlen.html/">RKI</a> & \
        <a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0/data">RKI</a>, \
        Intensivbetten: <a href="https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/8fc79b6cf7054b1b80385bda619f39b8_0/data">DIVI</a>, \
        Timeline: <a href="https://github.com/CSSEGISandData/COVID-19">Johns Hopkins CSSE</a> (via: <a href="https://covid19api.com/">covid19api.com</a>)',

    })
    Layer.addTo(map)
    map.fitBounds(Layer.getBounds().pad(0.02))
}

map._controlContainer.onclick = (e) => {
    locked = false
    Layer.resetStyle()
    info.update()
}


map.setView([51.33061163769853, 10.458984375000002], 6)


var info = L.control()

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info minwidth')
    this.update()
    return this._div
}

info.update = function (props) {
    if (props) {
        this._div.style.display = ""
        if (style != "intensivbetten") {
            this._div.innerHTML = '<h4>' + props.cases.name + '</h4>' +
                createHtmlToDisplay("Inzidenz", props.cases.weekIncidence.toFixed(0)) +
                createHtmlToDisplay("Fälle/100k", props.cases.casesPer100k.toFixed(0)) +
                "<hr>" +
                createHtmlToDisplay("Fälle", props.cases.count) +
                createHtmlToDisplay("Tode", props.cases.deaths) +
                createHtmlToDisplay("Bevölkerung", props.cases.population) +
                "<div class='date'>" + cases.lastUpdate + "</div>"
        } else {
            this._div.innerHTML = '<h4>' + props.cases.name + '</h4>'
            if (props.intensivbetten) {
                this._div.innerHTML = this._div.innerHTML +
                    createHtmlToDisplay("Anteil freier Betten", props.intensivbetten.anteil_freier_betten + "%") +
                    createHtmlToDisplay("Anteil Covid beatmet", props.intensivbetten.anteil_covid_beatmet + "%") +
                    createHtmlToDisplay("Anteil Covid betten", props.intensivbetten.anteil_covid_betten + "%") +
                    "<hr>" +
                    createHtmlToDisplay("Betten frei", props.intensivbetten.betten_frei) +
                    createHtmlToDisplay("Betten belegt", props.intensivbetten.betten_belegt) +
                    createHtmlToDisplay("Betten gesamt", props.intensivbetten.betten_gesamt) +
                    createHtmlToDisplay("Fälle Covid aktuell", props.intensivbetten.faelle_covid_aktuell) +
                    createHtmlToDisplay("Fälle Covid aktuell beatmet", props.intensivbetten.faelle_covid_aktuell_beatmet) +
                    createHtmlToDisplay("Anzahl Meldebereiche", props.intensivbetten.anzahl_meldebereiche) +
                    "<div class='date'>" + intensivbetten.lastUpdate + "</div>"
            }
        }
    } else {
        this._div.style.display = "none"
    }
}

info.addTo(map)


var legend = L.control({ position: 'bottomleft' })

legend.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info legend')

    if (style == "weekIncidence") {
        this._div.innerHTML = '\
        <div class="colorSquare" style="background-color:#d2cd84;"></div><span><35 </span><br> \
        <div class="colorSquare" style="background-color:#c6941a;"></div><span><50 </span><br> \
        <div class="colorSquare" style="background-color:#bb5220;"></div><span><100</span><br> \
        <div class="colorSquare" style="background-color:#af2632;"></div><span><200</span><br> \
        <div class="colorSquare" style="background-color:#8c0619;"></div><span>>200</span><br> \
        '
    } else if (style == "casesPer100k") {
        this._div.innerHTML = '\
        <div class="colorSquare" style="background-color:#c5c8d2;"></div><span><300 </span><br> \
        <div class="colorSquare" style="background-color:#a4b5c5;"></div><span><600 </span><br> \
        <div class="colorSquare" style="background-color:#84a8ba;"></div><span><900 </span><br> \
        <div class="colorSquare" style="background-color:#5c91b1;"></div><span><1200</span><br> \
        <div class="colorSquare" style="background-color:#2d6e9d;"></div><span><1600</span><br> \
        <div class="colorSquare" style="background-color:#0c4783;"></div><span>>1600</span><br> \
        '
    } else if (style == "intensivbetten") {
        this._div.innerHTML = '\
        <div>Anteil freier Betten</div>\
        <div class="colorSquare" style="background-color:#a0a0a0;"></div><span>Keine Daten</span><br> \
        <div class="colorSquare" style="background-color:#c63520;"></div><span><10%</span><br> \
        <div class="colorSquare" style="background-color:#d19443;"></div><span><25%</span><br> \
        <div class="colorSquare" style="background-color:#338c06;"></div><span>>25%</span><br> \
        '
    }
    return this._div
}

legend.addTo(map)




var cases
var geojson
var intensivbetten

var URL_geojson = "/landkreise_simplify.geo.json" // from http://opendatalab.de/projects/geojson-utilities/
var URL_districts = "https://api.corona.app.5ls.de/districts"
var URL_country = "https://api.corona.app.5ls.de/country"
var URL_intensivbetten = "https://api.corona.app.5ls.de/intensivbetten"

//URL_districts = "https://cors-anywhere.herokuapp.com/" + URL_districts; URL_country = "https://cors-anywhere.herokuapp.com/" + URL_country

f(URL_geojson, (data) => {
    geojson = data

    if (cases) draw()
})

f(URL_districts, (data) => {
    cases = {
        lastUpdate: data.lastUpdate,
        states: {}
    }

    data.districts.forEach(element => {
        cases.states[element.county] = element
        cases.states[element.name] = element
    })

    if (geojson) draw()
})


var country_info = L.control({ position: 'bottomright' })

country_info.onAdd = function (map) {
    this._div = L.DomUtil.create('div')
    return this._div
}

country_info.addTo(map)

f(URL_country, (data) => {
    country_info._div.innerHTML = '<a href="/timeline" style="color: black;text-decoration: none;">' +
        '<h4>' + "Bundesweit" + '</h4>' +
        createHtmlToDisplay("diff. Vortag", "+" + data.diff) +
        createHtmlToDisplay("Inzidenz", data.weekIncidence.toFixed(0)) +
        "</a>" +
        "<div class='date'>" + data.lastUpdate + " (8:30Uhr)</div>"
    country_info._div.classList.add("info")
})

function createHtmlToDisplay(label, value) {
    return "<div class='label'>" + label + ": </div><div class='value'>" + value + "</div><br>"
}

function getId(feature) {
    let GEN_id = feature.properties.GEN

    if (GEN_id == "Berlin") GEN_id = "Berlin Pankow"

    if (feature.properties.BEZ == "Landkreis" || feature.properties.BEZ == "Kreis") BEZ_id = "LK " + GEN_id
    else if (feature.properties.BEZ == "Kreisfreie Stadt" || feature.properties.BEZ == "Stadtkreis") BEZ_id = "SK " + GEN_id
    else throw feature


    if (cases.states[BEZ_id]) {
        return BEZ_id
    } else if (cases.states[GEN_id]) {
        return GEN_id
    }
    else throw feature
}
