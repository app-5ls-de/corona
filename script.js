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


var legend = L.control({position: 'topleft'})

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend de')
    div.innerHTML = '<a class="world" href="/world">world</a><a class="de" href="/de">de</a>'

    return div
}

legend.addTo(map)


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
