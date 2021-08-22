var URL_host = "https://api.corona.app.5ls.de";
var URL_api = "https://api.corona-zahlen.org";

let IncidenceRanges = [
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
];

let RateRanges = [
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
    max: 0.08,
    color: "#543D35",
  },
  {
    min: 0.08,
    max: null,
    color: "#020003",
  },
];

var config = {
  series: [
    {
      name: "Inzidenz",
      folder: "incidence",
      key: "weekIncidence",
      scope: "districts",
      ranges: IncidenceRanges,
    },
    {
      name: "Infektionsrate",
      folder: "cases",
      key: "casesRate",
      scope: "districts",
      unit: "%",
      ranges: RateRanges,
    },
    {
      name: "Letalitätsrate",
      folder: "cases",
      key: "deathRate",
      scope: "districts",
      unit: "%",
      ranges: RateRanges,
    },
    {
      name: "Impffortschritt",
      folder: "vaccinations",
      key: "secondVaccinationQuote",
      scope: "states",
      unit: "%",
      ranges: [
        {
          min: null,
          max: 0.34,
          color: "#88b9b2",
        },
        {
          min: 0.34,
          max: 0.37,
          color: "#6fa9a6",
        },
        {
          min: 0.37,
          max: 0.40,
          color: "#3a7e8d",
        },
        {
          min: 0.40,
          max: 0.43,
          color: "#316079",
        },
        {
          min: 0.43,
          max: 0.46,
          color: "#274265",
        },
        {
          min: 0.46,
          max: null,
          color: "#1d1f4e",
        },
      ],
    },
    {
      name: "Inzidenz Welt",
      folder: "cases",
      key: "weekIncidence",
      scope: "world",
      ranges: IncidenceRanges,
    },
    {
      name: "Infektionsrate Welt",
      folder: "cases",
      key: "casesRate",
      scope: "world",
      unit: "%",
      ranges: RateRanges,
    },
  ],
  scopes: {
    districts: {
      dataURLs: [URL_host + "/districts"],
      geojsonURL: "/districts.geo.json",
    },
    states: {
      dataURLs: [URL_host + "/states"],
      geojsonURL: "/states.geo.json",
    },
    world: {
      dataURLs: [URL_host + "/world"],
      geojsonURL: "/world.geo.json",
    },
  },
};
