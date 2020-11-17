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

function styleSwitch(e) {
    if (!["weekIncidence", "casesPer100k"].includes(e.id)) return
    style = e.id
    switcher.addTo(map)
    legend.addTo(map)
    Layer.resetStyle()
}

var switcher = L.control({ position: 'topleft' })

switcher.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info switcher')
    if (style == "weekIncidence") this._div.classList.add("weekIncidence")
    if (style == "casesPer100k") this._div.classList.add("casesPer100k")

    this._div.innerHTML = '<button onclick="styleSwitch(this)" id="weekIncidence" class="weekIncidence">Inzidenz</button><button onclick="styleSwitch(this)" id="casesPer100k" class="casesPer100k">Fälle/100k</button>'

    return this._div
}

switcher.addTo(map)


var Layer
function draw() {
    document.getElementById("spinner").style.display = "none"

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        })
    }

    function highlightFeature(e) {
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
        Layer.resetStyle(e.target)

        info.update()
    }

    function zoomToFeature(e) {
        //map.fitBounds(e.target.getBounds())
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
        }
    })
    Layer.addTo(map)
    map.fitBounds(Layer.getBounds().pad(0.02))
}




map.setView([51.33061163769853, 10.458984375000002], 6)


var info = L.control()

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info')
    this.update()
    return this._div
}

info.update = function (props) {
    if (props) {
        this._div.style.display = ""
        this._div.innerHTML = '<h4>' + props.cases.name + '</h4>' +
            'Inzidenz: ' + props.cases.weekIncidence.toFixed(0) + '<br>' +
            'Fälle: ' + props.cases.count + '<br>' +
            'Fälle/100k: ' + props.cases.casesPer100k.toFixed(0) + '<br>' +
            'Tode: ' + props.cases.deaths + '<br>' +
            'Bevölkerung: ' + props.destatis.population + '<br>'
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
    }
    return this._div
}

legend.addTo(map)




var cases
var geojson

var URL_geojson = "/landkreise_simplify.geo.json" // from http://opendatalab.de/projects/geojson-utilities/
var URL_cases = "https://api.corona.app.5ls.de/districts"
//URL_cases = "https://cors-anywhere.herokuapp.com/" + URL_cases

f(URL_geojson, (data) => {
    geojson = data

    if (cases) draw()
})

f(URL_cases, (data) => {
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
