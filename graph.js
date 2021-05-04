var URL_host = "https://api.corona.app.5ls.de";
var URL_api = "https://api.corona-zahlen.org";

function sma(arr, range, format) {
  if (!Array.isArray(arr)) {
    throw TypeError("expected first argument to be an array");
  }

  function sum(arr) {
    var len = arr.length;
    var num = 0;
    while (len--) num += Number(arr[len]);
    return num;
  }
  function avg(arr, idx, range) {
    return sum(arr.slice(idx - range, idx)) / range;
  }

  var fn = typeof format === "function" ? format : Math.round;
  var num = range || arr.length;
  var res = Array(Math.round(num / 2)).fill(null);
  var len = arr.length + 1;
  var idx = num - 1;
  while (++idx < len) {
    res.push(fn(avg(arr, idx, num)));
  }
  return res;
}

var cache = {};
function f(urls, callback, downloadFinished) {
  if (Array.isArray(urls)) {
    var array = urls;
  } else {
    var array = [urls];
  }
  Promise.all(
    array.map((url) => {
      if (cache[url]) {
        return Promise.resolve(cache[url]);
      } else {
        return fetch(url)
          .then((response) => {
            if (response.ok) {
              return Promise.resolve(response);
            } else {
              return Promise.reject(new Error(response.statusText));
            }
          })
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            if (url.startsWith(URL_host) || url.startsWith(URL_api)) {
              cache[url] = response;
            }
            return response;
          });
      }
    })
  )
    .then((response) => {
      if (downloadFinished) downloadFinished();

      if (Array.isArray(urls)) {
        callback(response);
      } else {
        callback(response[0]);
      }
    })
    .catch((error) => {
      if (downloadFinished) downloadFinished();
      console.error("Request failed", error, urls);
    });
}

function plot(id, title, yLabel, categories, series) {
  const chart = Highcharts.chart(id, {
    chart: {
      scrollablePlotArea: {
        minWidth: 700,
        scrollPositionX: 1,
      },
      spacingBottom: 10,
      spacingTop: 10,
      spacingLeft: 10,
      spacingRight: 10,
      zoomType: "x",
    },
    title: {
      text: title,
    },
    tooltip: {
      shared: true,
      crosshairs: true,
    },
    xAxis: {
      type: "datetime",
      categories: categories,
    },
    yAxis: {
      title: {
        text: yLabel,
      },
    },

    series: series,
  });
}

let div_container = document.getElementById("container");

let div_cases = document.createElement("div");
div_cases.id = "cases";
div_container.appendChild(div_cases);

let div_deaths = document.createElement("div");
div_deaths.id = "deaths";
div_container.appendChild(div_deaths);

let div_vaccinations = document.createElement("div");
div_vaccinations.id = "vaccinations";
div_container.appendChild(div_vaccinations);

let div_rValue = document.createElement("div");
div_rValue.id = "rValue";
div_container.appendChild(div_rValue);

let div_deathRate = document.createElement("div");
div_deathRate.id = "deathRate";
div_container.appendChild(div_deathRate);

let div_weekIncidence = document.createElement("div");
div_weekIncidence.id = "weekIncidence";
div_container.appendChild(div_weekIncidence);

f(
  [
    "https://api.corona-zahlen.org/germany/history/cases",
    "https://api.corona-zahlen.org/germany/history/deaths",
  ],
  (response) => {
    let labels = [];
    let series = {
      cases: [
        {
          type: "scatter",
          name: "Datenpunkte",
          data: [],
          color: "#cccccc",
          marker: {
            radius: 3,
          },
        },
      ],
      deaths: [
        {
          type: "scatter",
          name: "Datenpunkte",
          data: [],
          color: "#cccccc",
          marker: {
            radius: 3,
          },
        },
      ],
      deathRate: [
        {
          type: "scatter",
          name: "Datenpunkte",
          data: [],
          color: "#cccccc",
          marker: {
            radius: 3,
          },
        },
      ],
    };

    //----

    const cases = response[0].data;
    const deaths = response[1].data;

    let dates = {};

    cases.forEach((element) => {
      if (!dates[element.date]) dates[element.date] = {};
      dates[element.date].cases = element.cases;
    });

    deaths.forEach((element) => {
      if (!dates[element.date]) dates[element.date] = {};
      dates[element.date].deaths = element.deaths;
    });

    const population = 83783945;
    for (const date in dates) {
      if (Object.hasOwnProperty.call(dates, date)) {
        const element = dates[date];

        /* if (population != null && element.cases != null)
              element.casesRate = element.cases / population; */
        if (element.cases != null && element.deaths != null)
          element.deathRate = element.deaths / element.cases;
      }
    }

    let combined = [];

    for (const key in dates) {
      if (dates.hasOwnProperty(key)) {
        dates[key].date = key;
        combined.push(dates[key]);
      }
    }

    //-----

    combined.forEach((element) => {
      let dateSplit = element.date.split("-");
      let label = dateSplit[2].split("T")[0] + "." + dateSplit[1];

      labels.push(label);
      series.cases[0].data.push(element.cases);
      series.deaths[0].data.push(element.deaths);
      series.deathRate[0].data.push(
        parseFloat((element.deathRate * 100).toPrecision(3))
      );
    });
    series.deathRate[0].data[16] = 0;

    series.cases.push({
      type: "line",
      name: "7-Tages Durchschnitt",
      data: sma(series.cases[0].data, 7),
    });
    series.deaths.push({
      type: "line",
      name: "7-Tages Durchschnitt",
      data: sma(series.deaths[0].data, 7),
    });
    series.deathRate.push({
      type: "line",
      name: "7-Tages Durchschnitt",
      data: sma(series.deathRate[0].data, 7, (a) =>
        parseFloat(a.toPrecision(3))
      ),
    });

    plot("cases", "Fälle", "Fälle", labels, series.cases);
    plot("deaths", "Todesfälle", "Fälle", labels, series.deaths);
    plot(
      "deathRate",
      "Letalitätsrate",
      "Letalitätsrate in %",
      labels,
      series.deathRate
    );
  }
);

f("https://api.corona-zahlen.org/vaccinations/history", (response) => {
  let labels = [];
  let series = [
    {
      type: "line",
      name: "Erste Impfung",
      data: [],
      visible: true,
    },
    {
      type: "line",
      name: "Zweite Impfung",
      color: "#547BBA",
      data: [],
      visible: true,
    },
  ];

  response.data.history.forEach((element) => {
    let dateSplit = element.date.split("-");
    let label = dateSplit[2].split("T")[0] + "." + dateSplit[1];

    labels.push(label);
    series[0].data.push(element.firstVaccination);
    series[1].data.push(element.secondVaccination);
  });

  plot("vaccinations", "Impfungen", "Anzahl", labels, series);
});

f("https://api.corona.app.5ls.de/rValue", (response) => {
  let labels = [];
  let series = [
    {
      type: "scatter",
      name: "Datenpunkte",
      data: [],
      color: "#cccccc",
      marker: {
        radius: 2,
      },
    },
    {
      type: "line",
      name: "7-Tages Durchschnitt",
      data: [],
      visible: true,
      zones: [
        {
          value: 1,
        },
        {
          color: "#d14f69",
        },
      ],
    },
  ];

  response.data.forEach((element) => {
    let dateSplit = element.date.split("-");
    let label = dateSplit[2].split("T")[0] + "." + dateSplit[1];

    labels.push(label);
    series[0].data.push(element.rValue);
    series[1].data.push(element.rValue7day);
  });

  plot("rValue", "R-Wert", "R-Wert", labels, series);
});

f("https://api.corona-zahlen.org/germany/history/incidence", (response) => {
  let labels = [];
  let series = [
    {
      type: "line",
      name: "Inzidenzwert",
      showInLegend: false,
      data: [],
      visible: true,
    },
  ];

  response.data.forEach((element) => {
    let dateSplit = element.date.split("-");
    let label = dateSplit[2].split("T")[0] + "." + dateSplit[1];

    labels.push(label);
    series[0].data.push(element.weekIncidence);
  });

  series[0].data = sma(series[0].data, 1);
  plot("weekIncidence", "Inzidenzwert", "Inzidenz", labels, series);
});
