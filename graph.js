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
    var res = [];
    var len = arr.length + 1;
    var idx = num - 1;
    while (++idx < len) {
        res.push(fn(avg(arr, idx, num)));
    }
    return res;
}

function f(url, callback) {
    fetch(url)
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
        .then(callback)
        .catch((error) => {
            console.log("Request failed", error);
        });
}

function plot(id, title, yLabel, categories, series) {
    const chart = Highcharts.chart(id, {
        chart: {
            scrollablePlotArea: {
                minWidth: 700,
            },
        },
        chart: {
            zoomType: "x",
        },
        title: {
            text: title,
        },
        subtitle: {
            text:
                document.ontouchstart === undefined
                    ? "Click and drag in the plot area to zoom in"
                    : "Pinch the chart to zoom in",
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

let div_timeline = document.createElement("div");
div_timeline.id = "timeline";
div_container.appendChild(div_timeline);
f(
    "https://cors-anywhere.herokuapp.com/" +
        "https://api-corona-app-5ls-de-git-add-v2-patrickhaussmann.vercel.app/history",
    (response) => {
        let labels = [];
        let series = [];

        series = [
            {
                type: "scatter",
                name: "Fälle",
                data: [],
                visible: false,
            },
            {
                type: "scatter",
                name: "Todesfälle",
                data: [],
                visible: false,
            },
        ];

        response.data.forEach((element) => {
            let dateSplit = element.date.split("-");
            let label = dateSplit[2].split("T")[0] + "." + dateSplit[1];

            labels.push(label);
            series[0].data.push(element.cases);
            series[1].data.push(element.deaths);
        });

        series.push({
            type: "line",
            name: "Fälle sma",
            data: sma(series[0].data, 7),
            visible: true,
        });

        series.push({
            type: "line",
            name: "Todesfälle sma",
            data: sma(series[1].data, 7),
            visible: true,
        });

        plot("timeline", "Fälle und Todesfälle", "Fälle", labels, series);
    }
);

let div_vaccinations = document.createElement("div");
div_vaccinations.id = "vaccinations";
div_container.appendChild(div_vaccinations);

f("https://api.corona-zahlen.org/vaccinations/history", (response) => {
    let labels = [];
    let series = [];

    series = [
        {
            type: "line",
            name: "Erste Impfung",
            data: [],
            visible: true,
        },
        {
            type: "line",
            name: "Zweite Impfung",
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
