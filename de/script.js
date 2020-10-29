
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
        'weekIncidence: ' + props.cases.weekIncidence.toFixed(0) + '<br>' +
        'count: ' + props.cases.count + '<br>' +
        'deaths: ' + props.cases.deaths + '<br>' +
        'population: ' + props.destatis.population + '<br>' 
    } else {
        this._div.style.display = "none"
    }
}

info.addTo(map)




var cases
var geojson

var URL_geojson = "/de/landkreise_simplify2000.geojson" // from http://opendatalab.de/projects/geojson-utilities/
var URL_cases = "https://cors-anywhere.herokuapp.com/https://rki-covid-api.now.sh/api/districts"


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
