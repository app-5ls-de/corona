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

var map = L.map('map', {
    zoomSnap: 0
}).setView([51.33061163769853,10.458984375000002], 6)



var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    //console.log(props)
    this._div.innerHTML = '<h4>Info</h4>' +  (props ?
        '<b>' + props.cases.name + '</b><br>' +
        'weekIncidence: ' + props.cases.weekIncidence.toFixed(0) + '<br>' +
        'count: ' + props.cases.count + '<br>' +
        'deaths: ' + props.cases.deaths + '<br>' +
        'population: ' + props.destatis.population + '<br>' 
        : '');
};

info.addTo(map);


/* function onLocationFound(e) {
    var myIcon = L.divIcon({className: 'location-icon'})
    L.marker(e.latlng, {icon: myIcon}).addTo(map)
}

map.locate({setView: true, maxZoom: 16});

map.on('locationfound', onLocationFound);

function onLocationError(e) {
    alert(e.message);
}

map.on('locationerror', onLocationError); */


/* var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + "black" + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map); */



var cases
var geojson

if (selected == "bundesländer") {
    var URL_geojson = "https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/master/2_bundeslaender/4_niedrig.geo.json"
    var URL_cases = "https://cors-anywhere.herokuapp.com/https://rki-covid-api.now.sh/api/states"
} else if (selected == "kreise") {
    var URL_geojson = "landkreise_simplify2000.geojson" // from http://opendatalab.de/projects/geojson-utilities/
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
            cases.states[element.county] = element
            cases.states[element.name] = element
        })
    }
    
    if (geojson) draw()
})

let i = 0
var Layer
function draw() {
    document.getElementById("spinner").style.display = "none"

    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        /* if (feature.properties && feature.properties.GEN) {
            layer.bindPopup(feature.properties.GEN);
        } */

        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        })
    }

    function highlightFeature(e) {
        var layer = e.target;
    
        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: ''
        })
    
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        info.update(layer.feature.properties);
    }

    function resetHighlight(e) {
        Layer.resetStyle(e.target);

        info.update();
    }

    function zoomToFeature(e) {
        //map.fitBounds(e.target.getBounds());
    }

    Layer = L.geoJSON(geojson, {
        onEachFeature: onEachFeature,
        style: function(feature) {
            
            if (selected == "bundesländer") {
                let id = feature.properties.id.replace("DE-",'')
                feature.properties.cases = cases.states[id]
 
                weekIncidence = feature.properties.cases.weekIncidence
            } else if (selected == "kreise") {
                let GEN_id = feature.properties.GEN

                if (GEN_id == "Berlin") GEN_id = "Berlin Pankow"

                if (feature.properties.BEZ == "Landkreis" || feature.properties.BEZ == "Kreis") BEZ_id = "LK " + GEN_id 
                else if (feature.properties.BEZ == "Kreisfreie Stadt" || feature.properties.BEZ == "Stadtkreis") BEZ_id = "SK " + GEN_id 
                else throw feature;

                feature.properties.cases = cases.states[BEZ_id]
                if (feature.properties.cases) {
                    weekIncidence = feature.properties.cases.weekIncidence
                } else {
                    feature.properties.cases = cases.states[GEN_id]
                    if (feature.properties.cases) {
                        weekIncidence = feature.properties.cases.weekIncidence
                    } else {
                        weekIncidence = -1
                    }
                }
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
            };

            return options
        }
    })
    Layer.addTo(map)
    map.fitBounds(Layer.getBounds().pad(0.02))
}














