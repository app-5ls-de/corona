
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
        this._div.innerHTML = '<h4>' + props.name + '</h4>'  + 
        'perOneHundredThousand: ' + props.cases.perOneHundredThousand.toFixed(0) + '<br>' +
        'count: ' + props.cases.active + '<br>' +
        'deaths: ' + props.cases.deaths + '<br>' +
        'population: ' + props.cases.population + '<br>' 
    } else {
        this._div.style.display = "none"
    }
}

info.addTo(map)

legend._div.classList.add("world")



var cases
var geojson

var URL_geojson = "/world/world.geo.json" // from https://geojson-maps.ash.ms/
var URL_cases = "https://disease.sh/v3/covid-19/countries"


f(URL_geojson,(data) => {
    geojson = data

    if (cases) draw()
})

f(URL_cases,(data) => {
    cases = {}

    data.forEach(element => {
        cases[element.countryInfo.iso3] = element
    })
    
    if (geojson) draw()
})



function getIncidence(feature) {
    let id = feature.properties.iso_a3
    
    feature.properties.cases = cases[id]
    if (feature.properties.cases) {
        feature.properties.cases.perOneHundredThousand = feature.properties.cases.activePerOneMillion / 10
        return feature.properties.cases.perOneHundredThousand
    } else {
        console.log(id,feature.properties.cases)
        return
    }

    return
}
