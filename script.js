function f(url,callback) {
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


/* function onLocationFound(e) {
    var myIcon = L.divIcon({className: 'location-icon'})
    L.marker(e.latlng, {icon: myIcon}).addTo(map)
}

map.locate({setView: true, maxZoom: 16})

map.on('locationfound', onLocationFound)

function onLocationError(e) {
    alert(e.message)
}

map.on('locationerror', onLocationError) */


var switcher = L.control({position: 'topleft'})

switcher.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info switcher')
    this._div.innerHTML = ''

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
        style: function(feature) {
            weekIncidence = getIncidence(feature)
           
            if (weekIncidence == undefined || weekIncidence == null) {
                weekIncidence = -1
            }

            if (weekIncidence < 0) color = "#a0a0a0"
            else if (weekIncidence < 35) color = "#d5cc88"
            else if (weekIncidence < 50) color = "#d29a33"
            else if (weekIncidence < 100) color = "#b33034" 
            else color = "#912521"

            let options = {
                radius: 8,
                fillColor: color,
                color: color == "#d5cc88" ? "#d4b35e" : color,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }

            return options
        }
    })
    Layer.addTo(map)
    map.fitBounds(Layer.getBounds().pad(0.02))
}




map.setView([51.33061163769853,10.458984375000002], 6)


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
        'Tode: ' + props.cases.deaths + '<br>' +
        'Bevölkerung: ' + props.destatis.population + '<br>' 
    } else {
        this._div.style.display = "none"
    }
}

info.addTo(map)


var legend = L.control({position: 'bottomleft'})

legend.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info legend')
    this._HTML_1 = '\
    <div class="colorSquare" style="background-color:#a0a0a0;"></div><span><0 </span><br> \
    <div class="colorSquare" style="background-color:#d5cc88;"></div><span><35</span><br> \
    <div class="colorSquare" style="background-color:#d29a33;"></div><span><50</span><br> \
    <div class="colorSquare" style="background-color:#b33034;"></div><span><100</span><br> \
    <div class="colorSquare" style="background-color:#912521;"></div><span>>100</span><br> \
    '
    return this._div
}

legend.addTo(map)


legend._div.innerHTML = legend._HTML_1


var cases
var geojson

var URL_geojson = "/landkreise_simplify.geo.json" // from http://opendatalab.de/projects/geojson-utilities/
var URL_cases = "https://api.corona.app.5ls.de/districts"


f(URL_geojson,(data) => {
    geojson = data

    if (cases) draw()
})

f(URL_cases,(data) => {
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



function getIncidence(feature) {
    let GEN_id = feature.properties.GEN

    if (GEN_id == "Berlin") GEN_id = "Berlin Pankow"

    if (feature.properties.BEZ == "Landkreis" || feature.properties.BEZ == "Kreis") BEZ_id = "LK " + GEN_id 
    else if (feature.properties.BEZ == "Kreisfreie Stadt" || feature.properties.BEZ == "Stadtkreis") BEZ_id = "SK " + GEN_id 
    else throw feature

    feature.properties.cases = cases.states[BEZ_id]
    if (feature.properties.cases) {
        weekIncidence = feature.properties.cases.weekIncidence
    } else {
        feature.properties.cases = cases.states[GEN_id]
        if (feature.properties.cases) {
            weekIncidence = feature.properties.cases.weekIncidence
        }
    }

    return weekIncidence
}
