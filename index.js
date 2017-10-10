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

var KWH_PRICE = 63.40 / 510; // how much do you pay per Kilowatt hour?
var DATA_FILE = "solar8.csv";
// ---------------------------------------------------
var GAUGE_WIDTH = 200;
var GAUGE_HEIGHT = 200;

var log;
var logFilter;
var FIELD_TIMESTAMP = "timestamp";
import {Chart as AmpChart} from "./charts/amps.js";
import {Chart as VoltChart} from "./charts/volts.js";
import {Chart as WattChart} from "./charts/watts.js";
import {Chart as BatteryChargeRangeChart} from "./charts/battery-voltage.js";
import {Chart as BatteryStateOfChargeChart} from "./charts/battery-soc.js";
import {Chart as BatteryTemperatureChart} from "./charts/battery-temp.js";
import {Chart as EnergyChart} from "./charts/energy.js";

var ampChart;
var voltChart;
var wattChart;
var batteryChargeRangeChart;
var batteryStateOfChargeChart;
var batteryTemperatureChart;
var energyChart;
google.charts.load("current", {packages: ["corechart", "line", "timeline", "gauge", "table"]});

google.charts.setOnLoadCallback(prepare);
function prepare() {
$(document).ready(function() {
  $("#tabs").tabs();
  ampChart = new AmpChart($("#chart_amps")[0]);
  voltChart = new VoltChart($("#chart_volts")[0]);
  wattChart = new WattChart($("#chart_watts")[0]);
  batteryChargeRangeChart = new BatteryChargeRangeChart($("#chart_battery")[0]);
  batteryStateOfChargeChart = new BatteryStateOfChargeChart($("#chart_battery_soc")[0]);
  batteryTemperatureChart = new BatteryTemperatureChart($("#chart_battery_temp")[0]);
  energyChart = new EnergyChart($("#chart_energy")[0]);

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
       log.fields = results.meta.fields;

       setupDates();
     },
     error: function(error, file) {
       console.error(error);
     }
    });
});

function drawBasic() {
  var filtered = logFilter;
  drawGauges(filtered);
  ampChart.draw(filtered);
  voltChart.draw(filtered);
  wattChart.draw(filtered);
  batteryChargeRangeChart.draw(filtered);
  batteryStateOfChargeChart.draw(filtered);
  batteryTemperatureChart.draw(filtered);
  energyChart.draw(filtered);
  drawStatus();
  drawData(filtered);
}
function drawData(fLog) {
  var data = new google.visualization.DataTable();
  log.fields.forEach(function(name) {
    var type;
    switch(name) {
      case "Array Status":
      case "Battery Status":
      case "Device Status":
      case "Charging Status":
      case "Load Status":
      case "timestamp":
        type = "string";
        break;
      default:
        type = "number";
        break;
    }
    data.addColumn(type, name);
  });
  data.addRows(fLog.map(function(record) {
    return log.fields.map(function(name) {
      return record[name];
    });
  }));
  var table = new google.visualization.Table($(".raw-data")[0]);
  table.draw(data);
}

function drawGauges(fLog) {
  var record = fLog[fLog.length - 1] || {};

// ---------------------- pv
    var watts = getValues(fLog, record, "Array Power(W)", MAX_PV_INPUT_POWER);
    var amps = getValues(fLog, record, "Array Current(A)", RATED_CHARGE_CURRENT);
    var volts = getValues(fLog, record, "Array Voltage(V)", MAX_PV_OPEN_CIRCUIT_VOLTAGE);
    drawGauge(watts, "Watts", ".pv-watts-");
    drawGauge(amps, "Amps", ".pv-amps-");
    drawGauge(volts, "Voltage", ".pv-volts-");
    var status = fLog.reduce(getStatus, {field: "Array Status"});
    drawStatusHoursGauge(status, "Hours", "Input", ".pv-hours-gauge");

    // lets get hours input was on

    var data = new google.visualization.DataTable();
    data.addColumn("string", "PV");
    data.addColumn("number", "Value");
    data.addColumn("number", "Low");
    data.addColumn("number", "High");
    data.addColumn("number", "Max");
    data.addRows([
      ["Watts", watts.value, watts.min, watts.max, watts.limit],
      ["Amps", amps.value, amps.min, amps.max, amps.limit],
      ["Volts", volts.value, volts.min, volts.max, volts.limit],
      ["Hours", secondsAsHours(status && status.sum ? status.sum["Input"] : 0), 0, secondsAsHours(status && status.sum ? status.sum["Input"] : 0), secondsAsHours(status && status.meta ? status.meta.total || 100 : 0)]
    ]);
    var table = new google.visualization.Table($(".pv-stats")[0]);
    table.draw(data);

    // ---------------------- battery
        var soc = getValues(fLog, record, "Battery SOC(%)", 100);
        var amps = getValues(fLog, record, "Battery Current(A)", RATED_CHARGE_CURRENT);
        var volts = getValues(fLog, record, "Battery Voltage(V)", BATTERY_INPUT_VOLTAGE_RANGE_MAX, BATTERY_INPUT_VOLTAGE_RANGE_MIN);
        var temperature = getValues(fLog, record, "Battery Temp.(℃)", 65, -20);
        drawGauge(soc, "SOC", ".battery-soc-");
        drawGauge(amps, "Amps", ".battery-amps-");
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
          ["Amps", amps.value, amps.min, amps.max, amps.limit],
          ["Volts", volts.value, volts.min, volts.max, volts.limit],
          ["℃", temperature.value, temperature.min, temperature.max, temperature.limit],
          ["℉", toFahrenheit(temperature.value), toFahrenheit(temperature.min), toFahrenheit(temperature.max), toFahrenheit(temperature.limit)]
        ]);
        var table = new google.visualization.Table($(".battery-stats")[0]);
        table.draw(data);
        // ---------------------- load
            var watts = getValues(fLog, record, "Load Power(W)", LOAD_MAX_WATTS);
            var amps = getValues(fLog, record, "Load Current(A)", LOAD_MAX_AMPS);
            var volts = getValues(fLog, record, "Load Voltage(V)", LOAD_MAX_VOLTS);
            drawGauge(watts, "Watts", ".load-watts-");
            drawGauge(amps, "Amps", ".load-amps-");
            drawGauge(volts, "Voltage", ".load-volts-");

            var status = fLog.reduce(getStatus, {field: "Load Status"});
            drawStatusHoursGauge(status, "Hours", "On", ".load-hours-gauge");

            var data = new google.visualization.DataTable();
            data.addColumn("string", "Load");
            data.addColumn("number", "Value");
            data.addColumn("number", "Low");
            data.addColumn("number", "High");
            data.addColumn("number", "Max");
            data.addRows([
              ["Watts", watts.value, watts.min, watts.max, watts.limit],
              ["Amps", amps.value, amps.min, amps.max, amps.limit],
              ["Volts", volts.value, volts.min, volts.max, volts.limit],
              ["Hours", secondsAsHours(status && status.sum ? status.sum["Input"] : 0), 0, secondsAsHours(status && status.sum ? status.sum["Input"] : 0), secondsAsHours(status && status.meta ? status.meta.total || 100 : 0)]
            ]);
            var table = new google.visualization.Table($(".load-stats")[0]);
            table.draw(data);

}
function getValues(records, currentRecord, field, limit, lowLimit) {
  if (records.length === 0) {
    return {
      value: 0,
      min: 0,
      max: 0,
      limit: limit,
      lowLimit: lowLimit
    }
  };
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
function secondsAsHours(seconds) {
  return +((seconds || 0) / 3600).toFixed(1);
}
function drawStatusHoursGauge(data, label, onName, classPrefix) {
  var element = $(classPrefix)[0];
  var chart = new google.visualization.Gauge(element);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    [label, secondsAsHours((data && data.sum) ? data.sum[onName] : 0)]
  ]);
  var options = {
    min: 0,
    max: secondsAsHours(data.meta ? data.meta.total || 100 : 100),
    width: GAUGE_WIDTH,
    height: GAUGE_HEIGHT
  };
  fixGaugeOptions(options);
  chart.draw(dataTable, options);
}
function fixGaugeOptions(options) {
  if(options.max <= options.min) {
    options.max = options.min + 100;
  }
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
    greenColor: "#cccccc",
    width: GAUGE_WIDTH,
    height: GAUGE_HEIGHT
  };
  chart.draw(dataTable, options);
  $(classPrefix + "value").text(data.value);
  $(classPrefix + "low").text(data.min);
  $(classPrefix + "high").text(data.max);
  $(classPrefix + "max").text(data.limit);
}
function getStatus(status, record, index, array) {
  var fieldName = status.field;
  var meta = status.meta = status.meta || {
    values: []
  };
  var last = meta.last = meta.last || {
    ts: record._ts.clone()
  };
  var sum = status.sum = status.sum || {};

  var values = meta.values = meta.values || [];
  var currentStatus = record[fieldName];
  if (values.indexOf(currentStatus) === -1) {
    values.push(currentStatus);
    status[currentStatus] = [];
  }
  var statusRecords = status[currentStatus];

  var startTs = record._ts.clone();
  var endTs = startTs.clone();
  endTs.add(11, "minutes");

  if (currentStatus !== last.status) {
    statusRecords.push({start: startTs, end: endTs});
  } else {
    var latestRecord = statusRecords[statusRecords.length - 1];
    var max = (latestRecord ? latestRecord.end : endTs).clone();
    max.add(13, "minutes");
    if (startTs.isAfter(last.ts) && startTs.isBefore(max)) {
      latestRecord.end = endTs;
    } else {
      statusRecords.push({start: startTs, end: endTs});
    }
  }

  // we are done grabbing all status data. let's rollup everything
  if (index === array.length - 1) {
    var total = 0;
    meta.values.forEach(function(key) {
      var duration = status[key].reduce(function(total, record) {
        return total + moment.duration(record.end.diff(record.start)).asSeconds();
      }, 0);
      sum[key] = duration;
      total += duration;
    });
    meta.total = total;
  }

  last.status = currentStatus;
  last.ts = startTs.clone();
  return status;
}

function drawStatus() {
  var data = new google.visualization.DataTable();
  data.addColumn({ type: 'string', id: 'Type' });
  data.addColumn({ type: 'string', id: 'Name' });
  data.addColumn({ type: 'datetime', id: 'Start' });
  data.addColumn({ type: 'datetime', id: 'End' });
  var status = [].concat(
     getEvents("Array", "Array Status"),
     getEvents("Charging", "Charging Status"),
     getEvents("Battery", "Battery Status"),
     getEvents("Device", "Device Status"),
     getEvents("Load", "Load Status")
   )
  data.addRows(status);
   function getEvents(type, name) {
     if (logFilter.length === 0) {
       var range = JSON.parse($("[name=\"range\"]").val())
       return [
         [type, "n/a", new moment(range.start).startOf("day").toDate(), new moment(range.end).endOf("day").toDate()]
       ];
     }
     var rows = [];
     var state = [];
     var lastTs;
     logFilter.map(function(line, i) {
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

function setupDates() {

  var range = {
    min: log.reduce(earliestRecord)._ts,
    max: log.reduce(latestRecord)._ts
  }
  $("[name=\"range\"]")
    .daterangepicker({
      datepickerOptions: {
        minDate: range.min.toDate(),
        maxDate: range.max.toDate()
      }
    })
    .on("change", function(event) {
      filterLogs(JSON.parse($("[name=\"range\"]").val()));
    });

  // set initial filter to today...
  filterLogs({
    start: range.max.format("YYYY-MM-DD"),
    end: range.max.format("YYYY-MM-DD")
  });

  function filterLogs(newRange) {
    var start = new moment(newRange.start);
    var end = new moment(newRange.end);
    start.startOf("day");
    end.endOf("day");

    logFilter = log.filter(function(record) {
      return record._ts.isBetween(start, end);
    });

    drawBasic();
  }
}

function earliestRecord(minimum, record) {
  return minimum._ts.isBefore(record._ts) ? minimum : record;
}

function latestRecord(maximum, record) {
  return maximum._ts.isAfter(record._ts) ? maximum : record;
}

function toFahrenheit(celsius) {
  return (celsius * (9/5)) + 32;
}

}
