/*
These are values found in the documentation specifically for HY-MPPT40. It's also
assuming optimal temperature/wire size with appropriate PV array and Battery.
They are only for reference!
https://www.acopower.com/media/attachment/file/h/y/hy-mppt2-20-30-40-4.pdf

*/
var PV_INPUT_POWER = 12; // Set this to match your panels. Either 12v or 24v
var RATED_CHARGE_CURRENT = 40;
var MAX_PV_OPEN_CIRCUIT_VOLTAGE = PV_INPUT_POWER === 12 ? 50 : 100; // although rated for 100v, temperature has an effect - so maxing at 92v/25c

var MAX_PV_INPUT_POWER = PV_INPUT_POWER === 12 ? 1560 : 3120; // this seems odd - as max amps is 40, so why not 480/960? also, 3*rated charge... still less?

var BATTERY_INPUT_VOLTAGE_RANGE_MAX = 32;
var BATTERY_INPUT_VOLTAGE_RANGE_MIN = 8;
var BATTERY_MAX_WATTS = PV_INPUT_POWER === 12 ? 520 : 1040;
var LOAD_MAX_WATTS = 1000;
var LOAD_MAX_AMPS = 40;
var LOAD_MAX_VOLTS = 12;
var DATA_FILE ="solar5.csv";
// ---------------------------------------------------

var log;
var logFilter;
var FIELD_TIMESTAMP = "timestamp";
import {chart as AmpChart} from "./charts/amps.js";
import {chart as VoltChart} from "./charts/volts.js";
import {chart as WattChart} from "./charts/watts.js";
import {chart as BatteryChargeRangeChart} from "./charts/battery-voltage.js";
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

  Papa.parse(DATA_FILE, {
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
       google.charts.load("current", {packages: ["corechart", "line", "timeline", "gauge", "table"]});
       google.charts.setOnLoadCallback(drawBasic);
     },
     error: function(error, file) {
       console.error(error);
     }
    });
});

function drawBasic() {
  var filtered = log.filter(isVisible);
  drawGauges(filtered);
  ampChart.draw(filtered);
  voltChart.draw(filtered);
  wattChart.draw(filtered);
  batteryChargeRangeChart.draw(filtered);
  batteryStateOfChargeChart.draw(filtered);
  batteryTemperatureChart.draw(filtered);
  drawStatus();
}

function drawGauges(fLog) {
  var record = fLog[fLog.length - 1];

// ---------------------- pv
    var watts = getValues(fLog, record, "Array Power(W)", MAX_PV_INPUT_POWER);
    var amps = getValues(fLog, record, "Array Current(A)", RATED_CHARGE_CURRENT);
    var volts = getValues(fLog, record, "Array Voltage(V)", MAX_PV_OPEN_CIRCUIT_VOLTAGE);
    drawGauge(watts, "Watts", ".pv-watts-");
    drawGauge(amps, "Current", ".pv-amps-");
    drawGauge(volts, "Voltage", ".pv-volts-");

    var data = new google.visualization.DataTable();
    data.addColumn("string", "PV");
    data.addColumn("number", "Value");
    data.addColumn("number", "Low");
    data.addColumn("number", "High");
    data.addColumn("number", "Max");
    data.addRows([
      ["Watts", watts.value, watts.min, watts.max, watts.limit],
      ["Current", amps.value, amps.min, amps.max, amps.limit],
      ["Volts", volts.value, volts.min, volts.max, volts.limit]
    ]);
    var table = new google.visualization.Table($(".pv-stats")[0]);
    table.draw(data);

    // ---------------------- battery
        var soc = getValues(fLog, record, "Battery SOC(%)", 100);
        var amps = getValues(fLog, record, "Battery Current(A)", RATED_CHARGE_CURRENT);
        var volts = getValues(fLog, record, "Battery Voltage(V)", BATTERY_INPUT_VOLTAGE_RANGE_MAX, BATTERY_INPUT_VOLTAGE_RANGE_MIN);
        var temperature = getValues(fLog, record, "Battery Temp.(℃)", 65, -20);
        drawGauge(soc, "SOC", ".battery-soc-");
        drawGauge(amps, "Current", ".battery-amps-");
        drawGauge(volts, "Voltage", ".battery-volts-");
        drawGauge(temperature, "℃", ".battery-temperature-");

        var data = new google.visualization.DataTable();
        data.addColumn("string", "Battery");
        data.addColumn("number", "Value");
        data.addColumn("number", "Low");
        data.addColumn("number", "High");
        data.addColumn("number", "Max");
        data.addRows([
          ["SOC", soc.value, soc.min, soc.max, soc.limit],
          ["Current", amps.value, amps.min, amps.max, amps.limit],
          ["Volts", volts.value, volts.min, volts.max, volts.limit],
          ["℃", temperature.value, temperature.min, temperature.max, temperature.limit]
        ]);
        var table = new google.visualization.Table($(".battery-stats")[0]);
        table.draw(data);
        // ---------------------- pv
            var watts = getValues(fLog, record, "Load Power(W)", LOAD_MAX_WATTS);
            var amps = getValues(fLog, record, "Load Current(A)", LOAD_MAX_AMPS);
            var volts = getValues(fLog, record, "Load Voltage(V)", LOAD_MAX_VOLTS);
            drawGauge(watts, "Watts", ".load-watts-");
            drawGauge(amps, "Current", ".load-amps-");
            drawGauge(volts, "Voltage", ".load-volts-");

            var data = new google.visualization.DataTable();
            data.addColumn("string", "Load");
            data.addColumn("number", "Value");
            data.addColumn("number", "Low");
            data.addColumn("number", "High");
            data.addColumn("number", "Max");
            data.addRows([
              ["Watts", watts.value, watts.min, watts.max, watts.limit],
              ["Current", amps.value, amps.min, amps.max, amps.limit],
              ["Volts", volts.value, volts.min, volts.max, volts.limit]
            ]);
            var table = new google.visualization.Table($(".load-stats")[0]);
            table.draw(data);

}
function getValues(records, currentRecord, field, limit, lowLimit) {
  var values = records.map(function(record) { return record[field]; });
  var result = {
    value: currentRecord[field],
    min: Math.min.apply(Math, values),
    max: Math.max.apply(Math, values),
    limit: limit
  };
  if (lowLimit) {
    result.lowLimit = lowLimit;
  };
  return result;
}
function drawGauge(data, label, classPrefix) {
  var element = $(classPrefix + "gauge")[0];
  var chart = new google.visualization.Gauge(element);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    [label, data.value]
  ]);
  var options = {
    min: data.lowLimit || 0,
    max: data.limit,
    greenFrom: data.min,
    greenTo: data.max,
    greenColor: "#cccccc"
  };
  chart.draw(dataTable, options);
  $(classPrefix + "value").text(data.value);
  $(classPrefix + "low").text(data.min);
  $(classPrefix + "high").text(data.max);
  $(classPrefix + "max").text(data.limit);
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
