var log;
var logFilter;
var FIELD_TIMESTAMP = "timestamp";
import {chart as AmpChart} from "./charts/amps.js";
import {chart as VoltChart} from "./charts/volts.js";
import {chart as WattChart} from "./charts/watts.js";
import {chart as BatteryChargeRangeChart} from "./charts/battery-charge-range.js";
import {chart as BatteryStateOfChargeChart} from "./charts/battery-soc.js";
import {chart as BatteryTemperatureChart} from "./charts/battery-temp.js";

var ampChart;
var voltChart;
var wattChart;
var batteryChargeRangeChart;
var batteryStateOfChargeChart;
var batteryTemperatureChart;

$(document).ready(function() {

  ampChart = new AmpChart($("#chart_amps")[0]);
  voltChart = new VoltChart($("#chart_volts")[0]);
  wattChart = new WattChart($("#chart_watts")[0]);
  batteryChargeRangeChart = new BatteryChargeRangeChart($("#chart_battery")[0]);
  batteryStateOfChargeChart = new BatteryStateOfChargeChart($("#chart_battery_soc")[0]);
  batteryTemperatureChart = new BatteryTemperatureChart($("#chart_battery_temp")[0]);

  $(".choose-set").change(function() {
    logFilter = $(this).val();
    drawBasic();
  });

  Papa.parse("solar5.csv", {
	   download: true,
	   header: true,
     skipEmptyLines: true,
     delimiter: ",",
     dynamicTyping: true,
     fastMode: true, // we do not have quotes
     beforeFirstChunk: function(data) {
       // fix headers
       data = data.replace(/ ,/gi, ",");
       data = data.replace(/(Total Energy Generated\(kWh\))\r\n/gi, "$1,timestamp\r\n");
       return data;
     },
     complete: function(results, file) {
       var tsHeader = results.meta.fields[results.meta.fields.length - 1];
       log = results.data.filter(function(record) {
         var date = record[tsHeader];
         record._ts = moment(date, "YYYY/M/D  H:m:s"); // 2017/2/14  12:11:0
         record._date = record._ts.toDate();
         // Sometimes header is written twice...
         return record._ts.isValid();
       });

       setupDates();

       //line._ts.isValid()
       google.charts.load("current", {packages: ["corechart", "line", "timeline", "gauge"]});
       google.charts.setOnLoadCallback(drawBasic);
     },
     error: function(error, file) {
       console.error(error);
     }
    });
});

function drawBasic() {
  var filtered = log.filter(isVisible);
  drawGauges();
  ampChart.draw(filtered);
  voltChart.draw(filtered);
  wattChart.draw(filtered);
  batteryChargeRangeChart.draw(filtered);
  batteryStateOfChargeChart.draw(filtered);
  batteryTemperatureChart.draw(filtered);
  drawStatus();
}

function drawGauges() {
  var fLog = log.filter(isVisible);
  var record = fLog[fLog.length - 1];
  var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['Battery %', Number(record["Battery SOC(%)"])],
    ['PV Watts', Number(record["Array Power(W)"])]
  ]);
    var options = {
            width: 400, height: 120,
            //redFrom: 0, redTo: 19,
            //yellowFrom:20, yellowTo: 49,
            //greenFrom: 50, greenTo: 100,
            minorTicks: 5
          };
    var chart = new google.visualization.Gauge(document.getElementById('chart_gauges'));
    chart.draw(data, options);
  var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['Battery V', Number(record["Battery Voltage(V)"])]
  ]);

    var options = {
            width: 400, height: 120,
            min:   Number(record["Battery Min. Voltage(V)"]),
            max: Number(record["Battery Max. Voltage(V)"]),
            //redFrom: 0, redTo: 19,
            //yellowFrom:20, yellowTo: 49,
            //greenFrom: 50, greenTo: 100,
            minorTicks: 1
          };
    var chart = new google.visualization.Gauge(document.getElementById('chart_gauges_battery'));
    chart.draw(data, options);

    //chart_gauges_battery
  //chart_gauges
}



function drawStatus() {
  var data = new google.visualization.DataTable();
  data.addColumn({ type: 'string', id: 'Type' });
  data.addColumn({ type: 'string', id: 'Name' });
  data.addColumn({ type: 'datetime', id: 'Start' });
  data.addColumn({ type: 'datetime', id: 'End' });
  data.addRows(
    [].concat(
       getEvents("Array", "Array Status"),
       getEvents("Charging", "Charging Status"),
       getEvents("Battery", "Battery Status"),
       getEvents("Device", "Device Status"),
       getEvents("Load", "Load Status")
     )
  );

   function getEvents(type, name) {
     var rows = [];
     var state = [];
     var lastTs;
     log.filter(isVisible).map(function(line, i) {
       lastTs = lastTs || line._ts.clone();
       var startTs = line._ts;
       var endTs = startTs.clone();
       endTs.add(11, "minutes");
       if (line[name] !== state[1]) {
         state = [type, line[name], startTs.toDate(), endTs.toDate()];
         rows.push(state);
       } else {
         var max = lastTs.clone();
         max.add(13, "minutes");
         if (startTs.isAfter(lastTs) && startTs.isBefore(max)) {
           // continue previous event
           state[3] = endTs.toDate();
         } else {
           // to far after last record, or jumped to prior date (changed time on device)
           state = [type, line[name], startTs.toDate(), endTs.toDate()];
           rows.push(state);
         }
       }
       lastTs = startTs.clone();
     });
     return rows;
   }

  var options = {
    timeline: {
      groupByRowLabel: true,
      avoidOverlappingGridLines: false
    },
    hAxis: {
      title: 'Record'
    },
    vAxis: {
      title: 'Voltage'
    }
  };
  var chart = new google.visualization.Timeline(document.getElementById('chart_status'));
  chart.draw(data, options);
}

function isVisible(record) {
  return typeof logFilter === "undefined" || logFilter === "" || record._ts.format("LL") === logFilter;
}
function setupDates() {
  $(".choose-set").append(log.reduce(uniqueDates, []).map(mapOption));
  function mapOption(text) {
    return $("<option>").val(text).text(text);
  }
  function uniqueDates(dates, record) {
    var date = record._ts.format("LL");
    if(dates.indexOf(date) === -1) {
      dates.push(date);
    }
    return dates;
  }
}
