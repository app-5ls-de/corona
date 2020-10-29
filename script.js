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





var selected = "kreise"    // ["bundesländer","kreise"]

var map = L.map('map').setView([51.33061163769853,10.458984375000002], 6)


/* var StamenTonerLines = new L.StamenTileLayer("toner-lite")
map.addLayer(StamenTonerLines) */

/* var OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
 maxZoom: 19,
 attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
})
OpenStreetMap.addTo(map) */

/* var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
})
Stadia_AlidadeSmoothDark.addTo(map) */

// show the scale bar on the lower left corner
//L.control.scale().addTo(map);

var cases
var geojson

if (selected == "bundesländer") {
    var URL_geojson = "https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/master/2_bundeslaender/4_niedrig.geo.json"
    var URL_cases = "https://cors-anywhere.herokuapp.com/https://rki-covid-api.now.sh/api/states"
} else if (selected == "kreise") {
    var URL_geojson = "https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/master/4_kreise/4_niedrig.geo.json"
    var URL_cases = "https://cors-anywhere.herokuapp.com/https://rki-covid-api.now.sh/api/districts"
}


f(URL_geojson,(data) => {
    geojson = data

    if (cases) draw()
})

f(URL_cases,(data) => {
    cases = {
        lastUpdate: data.lastUpdate,
        states: {}
    }

    if (selected == "bundesländer") {
        data.states.forEach(element => {
            cases.states[element.code] = element
        })
    } else if (selected == "kreise") {
        data.districts.forEach(element => {
            cases.states[element.name] = element
        })
    }
    
    if (geojson) draw()
})

let i = 0
var Layer
function draw() {
    document.getElementById("spinner").style.display = "none"
    Layer = L.geoJSON(geojson, {
        style: function(feature) {
            
            if (selected == "bundesländer") {
                let id = feature.properties.id.replace("DE-",'')
                element = cases.states[id]
                weekIncidence = element.weekIncidence
            } else if (selected == "kreise") {
                let id = feature.properties.NAME_3.replace(/ Städte$/,'')
                element = cases.states[id]
                if (element) {
                    weekIncidence = element.weekIncidence
                } else {
                    for (const key in cases.states) {
                        if (cases.states.hasOwnProperty(key)) {
                            if (key.startsWith(id)) {
                                //if (element) console.log(key)
                                element = cases.states[key];
                                break
                            }
                        }
                    }

                    /* console.log(feature)
                    console.log(id)
                    */

                    if (element) {
                        weekIncidence = element.weekIncidence
                    } else {
                        weekIncidence = -1
                        i++ 
                    }
                }
            }
            
            if (weekIncidence < 0) color = "#ffffff"
            else if (weekIncidence < 35) color = "#d5cc88"
            else if (weekIncidence < 50) color = "#d29a33"
            else if (weekIncidence < 100) color = "#b33034" 
            else color = "#912521"

            let options = {
                radius: 8,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            return options
        }
    })
    Layer.addTo(map)
    map.fitBounds(Layer.getBounds().pad(0))
}














