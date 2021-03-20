var URL_host = "https://api.corona.app.5ls.de";

var config = {
    series: {
        weekIncidence: {
            name: "Inzidenz",
            scope: "districts",
            ranges: [
                {
                    min: 0,
                    max: 1,
                    color: "#2D81B8",
                },
                {
                    min: 1,
                    max: 5,
                    color: "#7FD38D",
                },
                {
                    min: 5,
                    max: 15,
                    color: "#bfe99f",
                },
                {
                    min: 15,
                    max: 25,
                    color: "#FEFFB1",
                },
                {
                    min: 25,
                    max: 35,
                    color: "#FECA81",
                },
                {
                    min: 35,
                    max: 50,
                    color: "#F08A4B",
                },
                {
                    min: 50,
                    max: 100,
                    color: "#EB1A1D",
                },
                {
                    min: 100,
                    max: 200,
                    color: "#AB1316",
                },
                {
                    min: 200,
                    max: 350,
                    color: "#B374DD",
                },
                {
                    min: 350,
                    max: 500,
                    color: "#5B189B",
                },
                {
                    min: 500,
                    max: 1000,
                    color: "#543D35",
                },
                {
                    min: 1000,
                    max: null,
                    color: "#020003",
                },
            ],
        },
        deathRate: {
            name: "Letalitätsrate",
            scope: "districts",
            unit: "%",
            ranges: [
                {
                    min: 0,
                    max: 0.005,
                    color: "#bfe99f",
                },
                {
                    min: 0.005,
                    max: 0.01,
                    color: "#FEFFB1",
                },
                {
                    min: 0.01,
                    max: 0.02,
                    color: "#FECA81",
                },
                {
                    min: 0.02,
                    max: 0.03,
                    color: "#F08A4B",
                },
                {
                    min: 0.03,
                    max: 0.04,
                    color: "#EB1A1D",
                },
                {
                    min: 0.04,
                    max: 0.05,
                    color: "#AB1316",
                },
                {
                    min: 0.05,
                    max: 0.06,
                    color: "#B374DD",
                },
                {
                    min: 0.06,
                    max: 0.07,
                    color: "#5B189B",
                },
                {
                    min: 0.07,
                    max: null,
                    color: "#020003",
                },
            ],
        },
        casesRate: {
            name: "Infektionsrate",
            scope: "districts",
            unit: "%",
            ranges: [
                {
                    min: 0,
                    max: 0.005,
                    color: "#bfe99f",
                },
                {
                    min: 0.005,
                    max: 0.01,
                    color: "#FEFFB1",
                },
                {
                    min: 0.01,
                    max: 0.02,
                    color: "#FECA81",
                },
                {
                    min: 0.02,
                    max: 0.03,
                    color: "#F08A4B",
                },
                {
                    min: 0.03,
                    max: 0.04,
                    color: "#EB1A1D",
                },
                {
                    min: 0.04,
                    max: 0.05,
                    color: "#AB1316",
                },
                {
                    min: 0.05,
                    max: 0.06,
                    color: "#B374DD",
                },
                {
                    min: 0.06,
                    max: 0.07,
                    color: "#5B189B",
                },
                {
                    min: 0.07,
                    max: null,
                    color: "#020003",
                },
            ],
        },
        secondVaccinationQuote: {
            name: "Impffortschritt (nach Bundesland)",
            scope: "states",
            unit: "%",
            ranges: [
                {
                    min: 0,
                    max: 0.035,
                    color: "#88b9b2",
                },
                {
                    min: 0.035,
                    max: 0.04,
                    color: "#6fa9a6",
                },
                {
                    min: 0.04,
                    max: 0.045,
                    color: "#3a7e8d",
                },
                {
                    min: 0.045,
                    max: null,
                    color: "#274265",
                },
            ],
        },
    },
    scopes: {
        districts: {
            dataURL: URL_host + "/districts",
            geojsonURL: URL_host + "/districts.geojson",
        },
        states: {
            dataURL: URL_host + "/states",
            geojsonURL: URL_host + "/states.geojson",
        },
    },
};
