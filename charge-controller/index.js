var latestData = {};
var chargeControllerProtocol = {};
var getRealTimeDataRequestInterval;

loadingStarted();

$(document)
  .ajaxStart(loadingStarted)
  .ajaxStop(loadingStopped)
  .ready(documentReady);

function loadingStarted() {
  $(".loading").show();
}

function loadingStopped() {
  $(".loading").hide();
}

function documentReady() {
  $(".tabs").tabs().on("tabsactivate", tabActivated);
  google.charts.load(
    "current",
    {
      packages: [
        "corechart",
        "line",
        "timeline",
        "gauge",
        "table"
      ]
    }
  );
  google.charts.setOnLoadCallback(googleChartsLoaded);
}

function googleChartsLoaded() {
  getChargeControllerProtocol()
    .then(getAllData)
    .then(scheduleDataRequests);
}

function getChargeControllerProtocol() {
  return $.getJSON("./charge-controller.json")
     .then(gotChargeControllerProtocol)
     .fail(gotChargeControllerProtocolFailed);
}

function gotChargeControllerProtocolFailed(jqXHR, textStatus, errorThrown) {
  displayError("Get Charge Controller Protocol Failed", errorThrown);
}

function gotChargeControllerProtocol(data, textStatus, jqXHR) {
  chargeControllerProtocol = data;
}

function scheduleDataRequests() {
  getRealTimeData();
  getRealTimeDataRequestInterval = setInterval(getRealTimeData, 10 * 1000);
}

function getAllData() {
   return $.getJSON("./db-get-all.py")
      .then(gotLatestData)
      .fail(gotLatestDataFailed);
}
function getRealTimeData() {
   return $.getJSON("./db-get-real-time-data.py")
      .then(gotRealTimeData)
      .fail(gotRealTimeDataFailed);
}

function gotLatestDataFailed(jqXHR, textStatus, errorThrown) {
  displayError("Get latest data failed", errorThrown);
}
function gotRealTimeDataFailed(jqXHR, textStatus, errorThrown) {
  displayError("Get real time data failed", errorThrown);
}

function displayError(title, text) {
  $(".dialog")
    .attr({title: title})
    .text(text)
    .dialog({
      modal: true,
      height: "auto",
      resizable: false
    });
}
function gotRealTimeData(data, textStatus, jqXHR) {
  if (data.error) {
    gotRealTimeDataFailed(jqXHR, textStatus, data.error);
    return;
  }
  latestData = Object.assign(latestData, data);
  tabActivated();

}
function gotLatestData(data, textStatus, jqXHR) {
  if (data.error) {
    gotLatestDataFailed(jqXHR, textStatus, data.error);
    return;
  }
  latestData = data;
  tabActivated();
}

function tabActivated(event, ui) {
  var index = $(".tabs").tabs("option", "active");
  switch(index) {
    case 0:
      displayBattery();
      break;
    case 1:
      displayLoad();
      break;
    case 2:
      displayInput();
      break;
    default:
      //console.log("tab activated: %s", index);
      break;
  }
}

function displayBattery() {


  $(".battery-status").text(latestData.controller_real_time_status.rt_battery_status);
  $(".charging-equipment-status").text(latestData.controller_real_time_status.rt_charging_equipment_status);

  updateBatteryVoltageGauge();
  updateBatteryAmpsGauge();
  updateBatteryWattsGauge();
  updateBatterySocGauge();
  updateBatteryTempGauge();
  updateBatteryRemoteTempGauge();

  updateBatteryVoltageHour();
  updateBatteryAmpsHour();
  updateBatteryWattsHour();
  updateBatterySocHour();
  updateBatteryTempHour();

  // updateBatteryVoltageTable();
  // updateBatteryAmpsTable();
  // updateBatteryWattsTable();
  // updateBatterySocTable();
  // updateBatteryTempTable();

}
function displayLoad() {

  updateLoadVoltageGauge();
  updateLoadAmpsGauge();
  updateLoadWattsGauge();

  updateLoadVoltageHour();
  updateLoadAmpsHour();
  updateLoadWattsHour();

  // updateLoadVoltageTable();
  // updateLoadAmpsTable();
  // updateLoadWattsTable();

}
function displayInput() {

  updateInputVoltageGauge();
  updateInputAmpsGauge();
  updateInputWattsGauge();

  updateInputVoltageHour();
  updateInputAmpsHour();
  updateInputWattsHour();
  //
  // updateInputVoltageTable();
  // updateInputAmpsTable();
  // updateInputWattsTable();

}
function updateBatteryVoltageTable() {

    var chart = getChart(".battery-volts-table", google.visualization.Table);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "");
    dataTable.addColumn("string", "Name");
    dataTable.addColumn("number", "Voltage");
    dataTable.addRows([
      findRow("rt_battery_v"),
      findRow("rt_battery_rated_v"),
      findRow("rt_load_v"),
      findRow("setting_high_volt_disconnect"),
      findRow("setting_charging_limit_volt"),
      findRow("setting_over_volt_reconnect"),
      findRow("setting_equalization_voltage"),
      findRow("setting_boost_voltage"),
      findRow("setting_float_voltage"),
      findRow("setting_boost_reconnect_voltage"),
      findRow("setting_low_volt_reconnect"),
      findRow("setting_under_volt_recover"),
      findRow("setting_under_volt_warning"),
      findRow("setting_low_volt_disconnect"),
      findRow("setting_discharge_limit_volt")
    ]);
    chart.draw(dataTable);
}
function updateLoadVoltageTable() {

    var chart = getChart(".load-volts-table", google.visualization.Table);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "");
    dataTable.addColumn("string", "Name");
    dataTable.addColumn("number", "Voltage");
    dataTable.addRows([
      findRow("rt_load_v"),
      findRow("setting_high_volt_disconnect"),
      findRow("setting_over_volt_reconnect"),
      findRow("setting_low_volt_reconnect"),
      findRow("setting_under_volt_recover"),
      findRow("setting_under_volt_warning"),
      findRow("setting_low_volt_disconnect"),
      findRow("setting_discharge_limit_volt")
    ]);
    chart.draw(dataTable);
}
function getIcon(category) {
  var stopwatch = "\u23F1";
  var calendar = "\u{1F4C5}";
  var charts = "\u{1F4CA}";
  var writing = "\u270D";
  var star = "\u2B50";
  var hollowCircle = "\u2B55";
  return {
    controller_statistics: calendar,
    controller_real_time_data: stopwatch,
    controller_rated_data: star,
    controller_settings: writing,
    controller_coils: hollowCircle,
    controller_discrete_input: hollowCircle,
    controller_real_time_status: stopwatch
  }[category] || "";
}
function findRow(name) {
  var value = findValue(name);
  var meta = findMeta(name);
  var icon = getIcon(meta.category);
  return [icon, meta.name, value];
}
function findValue(name) {
  return Object.keys(latestData)
    .map(getAllDataOf)
    .reduce(mergeObjects, {})[name];
}
function findMeta(name) {
  return Object.keys(chargeControllerProtocol.data)
    .map(getLatestProtocolDataOf)
    .reduce(concatArrays, [])
    .filter(isField, {field: name})[0];
}
function isField(meta) {
  return this.field === meta.field;
}
function getLatestProtocolDataOf(key) {
  return chargeControllerProtocol.data[key].map(categorizie);
  function categorizie(row) {
    row.category = key;
    return row;
  }
}
function getAllDataOf(key) {
  return latestData[key];
}
function mergeObjects(a, b) {
  return Object.assign({}, a, b);
}
function concatArrays(a, b) {
  return a.concat(b);
}
var charts = {};
function getChart(selector, Constructor) {
  // Lazy-load chart as singleton to enable animation when charts are updated rather than recreated
  return charts[selector] = charts[selector] || new Constructor($(selector)[0]);
}
function mapHourField() {
  var indexes = Array.prototype.slice.call(arguments).map(function(name) {
    return latestData.hour_fields.indexOf(name);
  })
  return function mapRow(row) {
    var result = [moment.utc(row[0], "YYYY-MM-DD HH:mm:ss").local().toDate()]
    indexes.forEach(function(i){result.push(row[i]);});
    return result;
  }
}
function updateBatteryVoltageHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".battery-volts-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Volts");
  data.addRows(
    latestData.hour.map(mapHourField("rt_battery_v"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateLoadVoltageHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".load-volts-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Volts");
  data.addRows(
    latestData.hour.map(mapHourField("rt_load_v"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateInputVoltageHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".input-volts-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Volts");
  data.addRows(
    latestData.hour.map(mapHourField("rt_input_v"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateBatteryAmpsHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".battery-amps-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Amps");
  data.addRows(
    latestData.hour.map(mapHourField("rt_battery_a"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateLoadAmpsHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".load-amps-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Amps");
  data.addRows(
    latestData.hour.map(mapHourField("rt_load_a"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateInputAmpsHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".input-amps-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Amps");
  data.addRows(
    latestData.hour.map(mapHourField("rt_input_a"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateBatteryWattsHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".battery-watts-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Watts");
  data.addRows(
    latestData.hour.map(mapHourField("rt_battery_w"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateLoadWattsHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".load-watts-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Watts");
  data.addRows(
    latestData.hour.map(mapHourField("rt_load_w"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateInputWattsHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".input-watts-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Watts");
  data.addRows(
    latestData.hour.map(mapHourField("rt_input_w"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateBatterySocHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".battery-soc-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "SoC");
  data.addRows(
    latestData.hour.map(mapHourField("rt_battery_soc"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateBatteryTempHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".battery-temp-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Battery \xB0F");
  data.addColumn("number", "Remote \xB0F");
  data.addRows(
    latestData.hour.map(mapHourField("rt_battery_temp", "rt_remote_battery_temp"))
  );
  var options = {
    legend: {
      position: "none"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function updateBatteryVoltageGauge() {
  var chart = getChart(".battery-volts-gauge", google.visualization.Gauge);
  //var element = $(".battery-volts-gauge");
  //var chart = new google.visualization.Gauge(element[0]);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Volts", latestData.controller_real_time_data.rt_battery_v]
  ]);

  var voltages = [
    latestData.controller_real_time_data.rt_battery_v,
    latestData.controller_real_time_data.rt_battery_rated_v,
    latestData.controller_real_time_data.rt_load_v,
    latestData.controller_settings.setting_high_volt_disconnect,
    latestData.controller_settings.setting_charging_limit_volt,
    latestData.controller_settings.setting_over_volt_reconnect,
    latestData.controller_settings.setting_equalization_voltage,
    latestData.controller_settings.setting_boost_voltage,
    latestData.controller_settings.setting_float_voltage,
    latestData.controller_settings.setting_boost_reconnect_voltage,
    latestData.controller_settings.setting_low_volt_reconnect,
    latestData.controller_settings.setting_under_volt_recover,
    latestData.controller_settings.setting_under_volt_warning,
    latestData.controller_settings.setting_low_volt_disconnect,
    latestData.controller_settings.setting_discharge_limit_volt
  ];

  var min = 0;//Math.min.apply(Math, voltages);
  var max = Math.max.apply(Math, voltages);
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    redFrom: latestData.controller_settings.setting_charging_limit_volt,
    redTo: max,
    greenFrom: latestData.controller_settings.setting_low_volt_reconnect,
    greenTo: latestData.controller_settings.setting_charging_limit_volt,
    yellowFrom: min,
    yellowTo: latestData.controller_settings.setting_under_volt_warning,
    width: 200,
    height: 200,
    minorTicks: 4,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateLoadVoltageGauge() {
  var chart = getChart(".load-volts-gauge", google.visualization.Gauge);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Volts", latestData.controller_real_time_data.rt_load_v]
  ]);

  var min = 0;
  var max = latestData.controller_settings.setting_high_volt_disconnect;
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    redFrom: min,
    redTo:  latestData.controller_settings.setting_low_volt_disconnect,
    yellowFrom: latestData.controller_settings.setting_low_volt_disconnect,
    yellowTo: latestData.controller_settings.setting_under_volt_warning,
    greenFrom: latestData.controller_settings.setting_low_volt_reconnect,
    greenTo: max,
    width: 200,
    height: 200,
    minorTicks: 4,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateInputVoltageGauge() {
  var chart = getChart(".input-volts-gauge", google.visualization.Gauge);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Volts", latestData.controller_real_time_data.rt_input_v]
  ]);

  var min = 0;
  var max = latestData.controller_rated_data.rated_input_v;
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    minorTicks: 4,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateBatteryAmpsTable() {
    var chart = getChart(".battery-amps-table", google.visualization.Table);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "");
    dataTable.addColumn("string", "Name");
    dataTable.addColumn("number", "Amps");

    dataTable.addRows([
      findRow("rt_battery_a"),
      findRow("rt_load_a"),
      findRow("stat_battery_current"),
      findRow("rated_output_a"),
      findRow("rated_load_a")
    ]);
    chart.draw(dataTable);
}
function updateLoadAmpsTable() {
    var chart = getChart(".load-amps-table", google.visualization.Table);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "");
    dataTable.addColumn("string", "Name");
    dataTable.addColumn("number", "Amps");

    dataTable.addRows([
      findRow("rt_load_a"),
      findRow("rated_load_a")
    ]);
    chart.draw(dataTable);
}
function updateBatteryWattsTable() {
    var chart = getChart(".battery-watts-table", google.visualization.Table);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "");
    dataTable.addColumn("string", "Name");
    dataTable.addColumn("number", "Watts");

    dataTable.addRows([
      findRow("rt_battery_w"),
      findRow("rated_output_w")
    ]);
    chart.draw(dataTable);
}
function updateLoadWattsTable() {
    var chart = getChart(".load-watts-table", google.visualization.Table);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "");
    dataTable.addColumn("string", "Name");
    dataTable.addColumn("number", "Watts");

    dataTable.addRows([
      findRow("rt_load_w"),
      findRow("rated_output_w")
    ]);
    chart.draw(dataTable);
}
function updateBatteryAmpsGauge() {
  var chart = getChart(".battery-amps-gauge", google.visualization.Gauge);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Amps", latestData.controller_real_time_data.rt_battery_a]
  ]);

  var amps = [
    latestData.controller_real_time_data.rt_battery_a,
    latestData.controller_real_time_data.rt_load_a,
    latestData.controller_statistics.stat_battery_current,
    latestData.controller_rated_data.rated_output_a,
    latestData.controller_rated_data.rated_load_a
  ];

  var min = 0;
  var max = latestData.controller_rated_data.rated_output_a;
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    minorTicks: 10,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateLoadAmpsGauge() {
  var chart = getChart(".load-amps-gauge", google.visualization.Gauge);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Amps", latestData.controller_real_time_data.rt_load_a]
  ]);

  var min = 0;
  var max = latestData.controller_rated_data.rated_load_a;
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    minorTicks: 10,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateInputAmpsGauge() {
  var chart = getChart(".input-amps-gauge", google.visualization.Gauge);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Amps", latestData.controller_real_time_data.rt_input_a]
  ]);

  var min = 0;
  var max = latestData.controller_rated_data.rated_input_a;
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    minorTicks: 10,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateBatteryWattsGauge() {
  var chart = getChart(".battery-watts-gauge", google.visualization.Gauge);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Watts", latestData.controller_real_time_data.rt_battery_w]
  ]);

  var min = 0;
  var max = latestData.controller_rated_data.rated_output_w;
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 10.4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {

    majorTicks.push(i <= 2 ? Math.round(10 * (min + (size * i))) / 10 : "");
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    minorTicks: 5,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateLoadWattsGauge() {
  var chart = getChart(".load-watts-gauge", google.visualization.Gauge);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Watts", latestData.controller_real_time_data.rt_load_w]
  ]);

  var min = 0;
  var multiplier = latestData.controller_rated_data.rt_battery_rated_v === 12 ? 13 : 26;
  var max = latestData.controller_rated_data.rated_load_a * 13;
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 10.4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {

    majorTicks.push(i <= 2 ? Math.round(10 * (min + (size * i))) / 10 : "");
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    minorTicks: 5,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateInputWattsGauge() {
  var chart = getChart(".input-watts-gauge", google.visualization.Gauge);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Watts", latestData.controller_real_time_data.rt_input_w]
  ]);

  var min = 0;
  var max = latestData.controller_rated_data.rated_input_w;
  var diff = max - min;
  var majorTicks = ["0"];
  var n = 10.4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {

    majorTicks.push(i <= 2 ? Math.round(10 * (min + (size * i))) / 10 : "");
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    minorTicks: 5,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateBatterySocTable() {
    var chart = getChart(".battery-soc-table", google.visualization.Table);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "");
    dataTable.addColumn("string", "Name");
    dataTable.addColumn("number", "%");

    dataTable.addRows([
      findRow("rt_battery_soc"),
      findRow("setting_charging_percentage"),
      findRow("setting_discharging_percentage")
    ].map(fixPercent));

    chart.draw(dataTable);

    function fixPercent(row) {
      row[2] *= 100;
      return row;
    }
}
function updateBatteryTempTable() {
    var chart = getChart(".battery-temp-table", google.visualization.Table);
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "");
    dataTable.addColumn("string", "Name");
    dataTable.addColumn("number", "\xB0F");
    dataTable.addRows([
      findRow("rt_battery_temp"),
      findRow("rt_remote_battery_temp"),
      findRow("setting_battery_temp_warning_upper_limit"),
      findRow("setting_battery_temp_warning_lower_limit"),
      findRow("stat_battery_temp"),
      findRow("stat_ambient_temp")
    ].map(fixValue));

    chart.draw(dataTable);

    function fixValue(row) {
      row[2] = fahrenheit(row[2]);
      return row;
    }
}

function updateBatterySocGauge() {
  var chart = getChart(".battery-soc-gauge", google.visualization.Gauge);
  //var element = $(".battery-volts-gauge");
  //var chart = new google.visualization.Gauge(element[0]);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["SoC", latestData.controller_real_time_data.rt_battery_soc * 100]
  ]);
  var values = [
    latestData.controller_settings.setting_discharging_percentage * 100,
    latestData.controller_settings.setting_charging_percentage * 100,
    latestData.controller_real_time_data.rt_battery_soc * 100
  ];

  var min = 0;
  var max = 100;
  var diff = max - min;
  var majorTicks = [min];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v + "%"; })

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    greenFrom: latestData.controller_settings.setting_discharging_percentage * 100,
    greenTo: max,
    minorTicks: 5,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function fahrenheit(c) {
  return (c * (9/5)) + 32;
}
function updateBatteryTempGauge() {
  var chart = getChart(".battery-temp-gauge", google.visualization.Gauge);
  //var element = $(".battery-volts-gauge");
  //var chart = new google.visualization.Gauge(element[0]);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["\xB0F", fahrenheit(latestData.controller_real_time_data.rt_battery_temp)]
  ]);
  var values = [
    fahrenheit(latestData.controller_real_time_data.rt_battery_temp),
    fahrenheit(latestData.controller_settings.setting_battery_temp_warning_upper_limit),
    fahrenheit(latestData.controller_settings.setting_battery_temp_warning_lower_limit)
  ];

  var min = Math.min.apply(Math, values) - 25;
  var max = Math.max.apply(Math, values) + 26;
  var diff = max - min;
  var majorTicks = [min];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    redFrom: fahrenheit(latestData.controller_settings.setting_battery_temp_warning_upper_limit),
    redTo: max,
    yellowFrom: min,
    yellowTo: fahrenheit(latestData.controller_settings.setting_battery_temp_warning_lower_limit),
    yellowColor: "#4684ee",
    minorTicks: 5,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
function updateBatteryRemoteTempGauge() {
  var chart = getChart(".battery-remote-temp-gauge", google.visualization.Gauge);
  //var element = $(".battery-volts-gauge");
  //var chart = new google.visualization.Gauge(element[0]);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["\xB0F", fahrenheit(latestData.controller_real_time_data.rt_remote_battery_temp)]
  ]);
  var values = [
    fahrenheit(latestData.controller_real_time_data.rt_remote_battery_temp),
    fahrenheit(latestData.controller_settings.setting_battery_temp_warning_upper_limit),
    fahrenheit(latestData.controller_settings.setting_battery_temp_warning_lower_limit)
  ];

  var min = Math.min.apply(Math, values) - 25;
  var max = Math.max.apply(Math, values) + 26;
  var diff = max - min;
  var majorTicks = [min];
  var n = 4;
  var size = diff / n;
  for(var i = 1; i < n; i++) {
    majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  }
  majorTicks.push(max);

  var options = {
    min: min,
    max: max,
    width: 200,
    height: 200,
    redFrom: fahrenheit(latestData.controller_settings.setting_battery_temp_warning_upper_limit),
    redTo: max,
    yellowFrom: min,
    yellowTo: fahrenheit(latestData.controller_settings.setting_battery_temp_warning_lower_limit),
    yellowColor: "#4684ee",
    minorTicks: 5,
    animation: {
      dration: 400,
      easing: "inAndOut"
    },
    majorTicks: majorTicks
  };
  chart.draw(dataTable, options);
}
