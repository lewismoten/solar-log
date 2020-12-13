var latestData = {};
var latestStatistics = {
  days: {},
  kwhPerMonth: {}
};
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
        "table",
        "bar"
      ]
    }
  );
  google.charts.setOnLoadCallback(googleChartsLoaded);
}

function googleChartsLoaded() {
  getChargeControllerProtocol()
    .then(getAllData)
    .then(scheduleDataRequests)
    .then(getStatistics2)
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
  getRealTimeDataRequestInterval = setInterval(getRealTimeData, 30 * 1000);
}

function getAllData() {
   return $.getJSON("./db-get-all.py")
      .then(gotLatestData)
      .fail(gotLatestDataFailed);
}
function getRealTimeData() {
   return $.getJSON("./db-get-real-time-data.py")
      .fail(gotRealTimeDataFailed)
      .then(gotRealTimeData)
      .then(getControllerRealTimeStatus);
}

function getControllerRealTimeStatus() {
  return $.getJSON("./api/controller-real-time-status.py")
     .then(gotRealTimeDataStatus)
     .fail(gotRealTimeDataFailed);
}
var statistics = {};

function getStatistics2() {
  return $.getJSON("./db-get-statistics.py")
     .then(gotStatistics)
     .fail(gotLatestDataFailed)
     .then(getStatisticsPerMonth);
}
function getStatisticsPerMonth() {
  return $.getJSON("./api/kwh-generated-by-month.py")
     .then(gotStatisticsPerMonth)
     .fail(gotLatestDataFailed);
}
function gotStatistics(data, textStatus, jqXHR) {
  if (data.error) {
    gotRealTimeDataFailed(jqXHR, textStatus, data.error);
    return;
  }
  latestStatistics.days = Object.assign(latestStatistics.days, data);
  tabActivated();
}
function gotStatisticsPerMonth(data, textStatus, jqXHR) {
  if (data.error) {
    gotRealTimeDataFailed(jqXHR, textStatus, data.error);
    return;
  }
  latestStatistics.kwhPerMonth = Object.assign(latestStatistics.kwhPerMonth, data);
  tabActivated();
}
function getStatistics() {
  var type = "day";
  var format = "YYYY-MM-DD";
  var count = 200;
  var options = {
    current: {
      start: moment().startOf(type).format(format),
      end: moment().endOf(type).format(format),
      count: count
    },
    prior: {
      start: moment().subtract(1, type).startOf(type).format(format),
      end: moment().subtract(1, type).endOf(type).format(format),
      count: count
    },
    historical: {
      start: moment().subtract(13, type).startOf(type).format(format),
      end: moment().subtract(2, type).endOf(type).format(format),
      count: count
    }
  }

  return $.when(
    $.getJSON("./db-get-statistics.py", options.current),
    $.getJSON("./db-get-statistics.py", options.prior),
    $.getJSON("./db-get-statistics.py", options.historical)
  ).then(function(current, prior, historical) {
    statistics.current = current[0];
    statistics.prior = prior[0];
    statistics.historical = historical[0];
  });

}
function gotLatestDataFailed(jqXHR, textStatus, errorThrown) {
  displayError("Get latest data failed", errorThrown);
}
function gotRealTimeDataFailed(jqXHR, textStatus, errorThrown) {
  if(getRealTimeDataRequestInterval) {
    clearInterval(getRealTimeDataRequestInterval);
    getRealTimeDataRequestInterval = void 0;
  }
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
function gotRealTimeDataStatus(data, textStatus, jqXHR) {
  if (data.error) {
    gotRealTimeDataFailed(jqXHR, textStatus, data.error);
    return;
  }
  latestData = Object.assign(latestData, {statusOverTime: data});
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
      case 3:
      displayStatus();
    case 4:
      displayStatistics();
      break;
    case 5:
      displayTemperature();
      break;
    default:
      //console.log("tab activated: %s", index);
      break;
  }
}

function displayStatus() {
  updateBatteryStatusTimeline();
}

function getStatus(name) {
  if(!latestData || !latestData.controller_real_time_status) return;
  var value = latestData.controller_real_time_status[name];
  return getStatusFrom(value, findMeta(name)).join(", ");
}
function getStatusFrom(value, meta) {
  var status = [];
  meta.parts.forEach(function(part) {
    var subValue = (value >> part.shift) & part.mask;
    if(part.enum) {

      if(part.show0 === false && subValue == 0) {
        return;
      }
      if(part.showName === false) {
        status.push(part.enum[subValue]);
      } else {
        status.push(part.name + ": " + part.enum[subValue]);
      }
    } else if(subValue) {
      status.push(part.name);
    }
  });
  return status;

}
function displayStatistics() {
  displayVoltageStatistics();
  displayKwhTodayStatistics();
  try {

    displayKwhByMonthStatistics();

  } catch(e) {console.error(e); throw e};
  // foo
  // if(statistics.current) {
  //   updateInputWattsHistory();
  // }
}
function displayTemperature() {
  updateTemperatureBatteryGauge();
  updateTemperatureCaseGauge();
  updateTemperaturePowerGauge();
  updateTemperatureBatteryRemoteGauge();
  updateTemperatureHour();
}
function displayBattery() {

  $(".battery-status").text(getStatus("rt_battery_status"));
  $(".charging-status").text(getStatus("rt_charging_equipment_status"));
  $(".discharging-status").text(getStatus("rt_discharging_equipment_status"));

  updateBatteryVoltageGauge();
  updateBatteryVoltageInfo();
  updateBatteryAmpsGauge();
  updateBatteryWattsGauge();
  updateBatterySocGauge();

  updateBatteryVoltageHour();
  updateBatteryAmpsHour();
  updateBatteryWattsHour();
  updateBatterySocHour();

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
    var result = [moment.unix(Number(row[0])).local().toDate()]
    indexes.forEach(function(i){result.push(row[i]);});
    return result;
  }
}
function mapField(source, fields) {
  fields = Array.prototype.slice.call(arguments);
  source = fields.shift();
  var indexes = fields.map(function(name) {
    return source.fields.indexOf(name);
  })
  return function mapRow(row) {
    var result = [];
    indexes.forEach(function(i) {
      var value = row[i];

      if(source.fields[i].indexOf('date') === -1)
        result.push(row[i]);
      else
        result.push(moment(row[i]).toDate());
    });
    return result;
  }
}
function parsePart(value, part) {
  var subValue = (value >> part.shift) & part.mask;
  var parsed;
  if(part.enum) {
    parsed = part.enum[subValue];
  } else if(subValue) {
    parsed = part.name;
  }
  return parsed;
}
function addressByField(field) {
  var meta;
  var data = chargeControllerProtocol.data;
  Object.keys(data).find(function(key) {
    meta = data[key].find(function(address) {
      return address.field === field;
    });
    return meta;
  });
  return meta;
}

function unixToDate(value) {
  return moment.unix(Number(value)).local().toDate()
}
function getDischargingEquipmentStatusTimelineData() {
  var v = latestData.statusOverTime;
  var fieldIndex = v.fields.indexOf('rt_discharging_equipment_status');
  var dateIndex = v.fields.indexOf('create_date');
  var address = addressByField("rt_discharging_equipment_status");
  function statusReducer(index, title) {
    var part = address.parts[index];
    var lastValue;
    var start;
    var end;
    function parse(row) {
      const value = row[fieldIndex];
      var result = parsePart(value, part);
      if(index === 1) {
        // let non-default values pass through
        return result === part.enum[0] ? undefined : result;
      }
      if(index > 2) {
        // only pass name if non-default value
        return result === part.enum[0] ? undefined : part.name;
      }
      return result;
    }

    function buildRow() {
      return [
        title,
        lastValue,
        unixToDate(start),
        unixToDate(end)
      ];
    }
    return function(all, row, index, array) {
      create_date = row[dateIndex];
      value = parse(row);
      if(value === lastValue) {
        end = end ? Math.max(end, create_date) : create_date;
        start = start ? Math.min(start, create_date) : create_date;
      } else {
        if (lastValue) all.push(buildRow());
        lastValue = value;
        start = create_date;
        end = create_date;
      };
      if(index === array.length -1 && lastValue) {
        all.push(buildRow());
      }
      return all;
    }
  }
  return [].concat(
    v.data.reduce(statusReducer(0, 'Discharge Status'), []),
    v.data.reduce(statusReducer(1, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(2, 'Output Power'), []),
    v.data.reduce(statusReducer(3, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(4, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(5, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(6, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(7, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(8, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(9, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(10, 'Discharge Fault'), []),
    v.data.reduce(statusReducer(11, 'Discharge Fault'), [])
  );
}
function getChargingEquipmentStatusTimelineData() {
  var v = latestData.statusOverTime;
  var fieldIndex = v.fields.indexOf('rt_charging_equipment_status');
  var dateIndex = v.fields.indexOf('create_date');
  var address = addressByField("rt_charging_equipment_status");
  function statusReducer(index, title) {
    var part = address.parts[index];
    var lastValue;
    var start;
    var end;
    function parse(row) {
      const value = row[fieldIndex];
      var result = parsePart(value, part);
      if(index === 1 || index === 2) {
        // let non-default values pass through
        return result === part.enum[0] ? undefined : result;
      }
      if(index > 2) {
        // only pass name if non-default value
        return result === part.enum[0] ? undefined : part.name;
      }
      return result;
    }

    function buildRow() {
      return [
        title,
        lastValue,
        unixToDate(start),
        unixToDate(end)
      ];
    }
    return function(all, row, index, array) {
      create_date = row[dateIndex];
      value = parse(row);
      if(value === lastValue) {
        end = end ? Math.max(end, create_date) : create_date;
        start = start ? Math.min(start, create_date) : create_date;
      } else {
        if (lastValue) all.push(buildRow());
        lastValue = value;
        start = create_date;
        end = create_date;
      };
      if(index === array.length -1 && lastValue) {
        all.push(buildRow());
      }
      return all;
    }
  }
  return [].concat(
    v.data.reduce(statusReducer(0, 'Charger Status'), []),
    v.data.reduce(statusReducer(1, 'Charging'), []),
    v.data.reduce(statusReducer(2, 'Charging'), []),
    v.data.reduce(statusReducer(3, 'Charging Fault'), []),
    v.data.reduce(statusReducer(4, 'Charging Fault'), []),
    v.data.reduce(statusReducer(5, 'Charging Fault'), []),
    v.data.reduce(statusReducer(6, 'Charging Fault'), []),
    v.data.reduce(statusReducer(7, 'Charging Fault'), []),
    v.data.reduce(statusReducer(8, 'Charging Fault'), []),
    v.data.reduce(statusReducer(9, 'Charging Fault'), []),
    v.data.reduce(statusReducer(10, 'Charging Fault'), [])
  );
}
function getBatteryStatusTimelineData() {
  var v = latestData.statusOverTime;
  var fieldIndex = v.fields.indexOf('rt_battery_status');
  var dateIndex = v.fields.indexOf('create_date');
  var address = addressByField("rt_battery_status");
  function batteryStatusReducer(index, title) {
    var part = address.parts[index];
    var lastValue;
    var start;
    var end;
    function parse(row) {
      const value = row[fieldIndex];
      var result = parsePart(value, part);
      if(index === 0) {
        result = result === part.enum[0] ? undefined : result;
      } else {
        result = result === part.enum[0] ? undefined : part.name;
      }
      return result;
    }

    function buildRow() {
      return [
        title,
        lastValue,
        unixToDate(start),
        unixToDate(end)
      ];
    }
    return function(all, row, index, array) {
      create_date = row[dateIndex];
      value = parse(row);
      if(value === lastValue) {
        end = end ? Math.max(end, create_date) : create_date;
        start = start ? Math.min(start, create_date) : create_date;
      } else {
        if (lastValue) all.push(buildRow());
        lastValue = value;
        start = create_date;
        end = create_date;
      };
      if(index === array.length -1 && lastValue) {
        all.push(buildRow());
      }
      return all;
    }
  }
  return [].concat(
    v.data.reduce(batteryStatusReducer(0, 'Battery Fault'), []),
    v.data.reduce(batteryStatusReducer(1, 'Battery Fault'), []),
    v.data.reduce(batteryStatusReducer(2, 'Battery Fault'), []),
    v.data.reduce(batteryStatusReducer(3, 'Battery Fault'), [])
  );
}

function updateBatteryStatusTimeline() {
  if (!latestData.hasOwnProperty("statusOverTime")) {
    return;
  }
  try {
  var v = latestData.statusOverTime;

  var chart = getChart(".status-timeline", google.visualization.Timeline);
  var data = new google.visualization.DataTable();
  data.addColumn({ type: 'string', id: 'Type' });
  data.addColumn({ type: 'string', id: 'Name' });
  data.addColumn({ type: 'datetime', id: 'Start' });
  data.addColumn({ type: 'datetime', id: 'End' });

  var rows = [].concat(
    getBatteryStatusTimelineData(),
    getChargingEquipmentStatusTimelineData(),
    getDischargingEquipmentStatusTimelineData()
  );

  if(rows.length === 0) {
    start = unixToDate(v.data[0][0]);
    end = unixToDate(v.data[v.data.length - 1][0]);
    rows.push(['Battery Fault', 'None', start, end])
  }
  data.addRows(rows);
   var options = {
     timeline: {
       groupByRowLabel: true,
       avoidOverlappingGridLines: false
     },
     title: 'Battery Status'
   };
  chart.draw(data, options);
} catch(e) {
  console.error(e);
  throw e;
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
function getStatisticsFieldIndex(name) {
  return statistics.current.fields.indexOf(name);
}
function updateInputWattsHistory(current, prior, historical) {

  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".stats-input-watts", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("timeofday", "Time of Day");
  data.addColumn("number", "Today");
  data.addColumn("number", "Yesterday");
  data.addColumn("number", "Prior 7 Days");

  var i = getStatisticsFieldIndex("rt_input_w");
  // always show 1 day, 5 minute increments
  var start = new moment().startOf("day");//start.format("HH:mm:ss");
  // need to sync up actual time - otherwise we are in utc
  var end = start.clone().endOf("day");

  while(start.isBefore(end)) {
    var time = start.format("HH:mm:ss");
    var row = [time.split(":").map(function(foo){return Number(foo);})];
    row.push(valueOf(statistics.current));
    row.push(valueOf(statistics.prior));
    row.push(valueOf(statistics.historical));
    if(row.some(function(r) {
      return typeof r === "number" && r > 0;
    })) {
      data.addRows([row]);
    }
    //start.add(seconds, "seconds");
    start.add(15, "minutes");
  }
  function valueOf(type) {
    var match = type.data.filter(function(foo) {return foo[0] === time;})[0];
    return match ? match[i] : null
  }
  var options = {
    legend: {
//      position: "none"
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
      position: "bottom"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function displayVoltageStatistics() {
  if(!latestStatistics.days.data) return;
  var chart = getChart(".statstics-voltages", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Day");
  data.addColumn("number", "PV Array Max");
  data.addColumn("number", "Battery Min");
  data.addColumn("number", "Battery Max");
  data.addRows(
    latestStatistics.days.data.map(mapField(
      latestStatistics.days,
      "create_date",
      "stat_max_input_v_today",
      "stat_min_battery_v_today",
      "stat_max_battery_v_today"
    ))
  );
  var options = {
    title: "Voltage",
    legend: {
      position: "bottom"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function displayKwhTodayStatistics() {
  if(!latestStatistics.days.data) return;
  var chart = getChart(".statstics-kwh-today", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Day");
  data.addColumn("number", "Consumed");
  data.addColumn("number", "Generated");
  data.addRows(
    latestStatistics.days.data.map(mapField(
      latestStatistics.days,
      "create_date",
      "stat_consumed_kwh_today",
      "stat_generated_kwh_today"
    ))
  );
  var options = {
    title: "kWh each day",
    legend: {
      position: "bottom"
    },
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };
  chart.draw(data, options);
}
function displayKwhByMonthStatistics() {
  if(!latestStatistics.kwhPerMonth.data) return;
  function asRow(values) {
    return values.map(function(value, index){
      if(index === 0) return moment(value).toDate();
      return value;
    })
  }
  var rows = latestStatistics.kwhPerMonth.data.map(asRow);
  var chart = getChart(".statstics-kwh-total", google.charts.Bar);
  var data = new google.visualization.DataTable();
  data.addColumn("date", "Month");
  latestStatistics.kwhPerMonth.years.forEach(function addYear(year) {
    data.addColumn("number", year);
  });
  data.addRows(rows);
  var options = {
    chart: {
      title: 'kWh Generated'
    },
    axes: {
      x: {
        0: {
          label: ''
        }
      }
    }
  };
  var monthFormatter = new google.visualization.DateFormat({pattern: 'MMMM'});
  monthFormatter.format(data, 0);

  var kWhFormatter = new google.visualization.PatternFormat('{0} kWh');
  latestStatistics.kwhPerMonth.years.forEach(function(year, idx) {
    idx++;
    kWhFormatter.format(data, [idx], idx)
  });
  chart.draw(data, options);
}
function updateTemperatureHour() {
  if (!latestData.hasOwnProperty("hour")) {
    return;
  }
  var chart = getChart(".temp-hour", google.visualization.LineChart);
  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Time of Day");
  data.addColumn("number", "Battery \xB0F");
  data.addColumn("number", "Remote Battery \xB0F");
  data.addColumn("number", "Case \xB0F");
  data.addColumn("number", "Power Component \xB0F");
  data.addRows(
    latestData.hour.map(mapHourField("rt_battery_temp", "rt_remote_battery_temp", "rt_case_temp", "rt_power_component_temp"))
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

  var s = latestData.controller_settings;

  var voltages = [
    latestData.controller_real_time_data.rt_battery_v,
    latestData.controller_real_time_data.rt_battery_rated_v,
    // latestData.controller_real_time_data.rt_load_v,
    s.setting_high_volt_disconnect,
    s.setting_charging_limit_volt,
    s.setting_over_volt_reconnect,
    s.setting_equalization_voltage,
    s.setting_boost_voltage,
    s.setting_float_voltage,
    s.setting_boost_reconnect_voltage,
    s.setting_low_volt_reconnect,
    s.setting_under_volt_recover,
    s.setting_under_volt_warning,
    s.setting_low_volt_disconnect,
    s.setting_discharge_limit_volt
  ];

  var min = Math.floor(
    Math.min(
      latestData.controller_real_time_data.rt_battery_v,
      latestData.controller_real_time_data.rt_battery_rated_v,
      s.setting_high_volt_disconnect,
      s.setting_charging_limit_volt,
      s.setting_over_volt_reconnect,
      s.setting_equalization_voltage,
      s.setting_boost_voltage,
      s.setting_float_voltage,
      s.setting_boost_reconnect_voltage,
      s.setting_low_volt_reconnect,
      s.setting_under_volt_recover,
      s.setting_under_volt_warning,
      s.setting_low_volt_disconnect,
      s.setting_discharge_limit_volt
    )
  );
  var max = Math.ceil(Math.max(
    latestData.controller_real_time_data.rt_battery_v,
    latestData.controller_real_time_data.rt_battery_rated_v,
    s.setting_high_volt_disconnect,
    s.setting_charging_limit_volt,
    s.setting_over_volt_reconnect,
    s.setting_equalization_voltage,
    s.setting_boost_voltage,
    s.setting_float_voltage,
    s.setting_boost_reconnect_voltage,
    s.setting_low_volt_reconnect,
    s.setting_under_volt_recover,
    s.setting_under_volt_warning,
    s.setting_low_volt_disconnect,
    s.setting_discharge_limit_volt
  ));
  var diff = max - min;
  var majorTicks = [];//["0"];
  var n = 4;
  var size = diff / n;
  for(var i = min; i < max; i++) {
    majorTicks.push(i);
  }
  // for(var i = 1; i < n; i++) {
  //   majorTicks.push(Math.round(10 * (min + (size * i))) / 10);
  // }
  majorTicks.push(max);
  majorTicks = majorTicks.map(function(v) { return v; })
//yyy
  var options = {
    min: min,
    max: max,
    redFrom: min,
    redTo: s.setting_low_volt_disconnect,
    greenFrom: Math.max(
      s.setting_low_volt_reconnect,
      s.setting_under_volt_warning
    ),
    greenTo: Math.min(
      s.setting_boost_reconnect_voltage,
      s.setting_boost_voltage,
      s.setting_float_voltage,
      s.setting_charging_limit_volt,
      s.setting_equalization_voltage,
      s.setting_high_volt_disconnect
    ),
    yellowFrom: s.setting_low_volt_disconnect,
    yellowTo: s.setting_under_volt_warning,
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
function updateBatteryVoltageInfo() {
  var s = latestData.controller_settings || {};
  var rtd = latestData.controller_real_time_data || {};
//zzz
  var chart = getChart(".battery-volts-info", google.visualization.Table);
  var dataTable = new google.visualization.DataTable();
  dataTable.addColumn('string', 'Setting');
  dataTable.addColumn('number', 'Voltage');
  var rows = [
    ['High Disconnect', s.setting_high_volt_disconnect],
    ['Charging Limit', s.setting_charging_limit_volt],
    ['Over Reconnect', s.setting_over_volt_reconnect],
    ['Equalization', s.setting_equalization_voltage],
    ['Boost', s.setting_boost_voltage],
    ['Float', s.setting_float_voltage],
    ['Boost Reconnect', s.setting_boost_reconnect_voltage],
    ['Low Reconnect', s.setting_low_volt_reconnect],
    ['Under Recover', s.setting_under_volt_recover],
    ['Under Warning', s.setting_under_volt_warning],
    ['Low Disconnect', s.setting_low_volt_disconnect],
    ['Discharge Limit', s.setting_discharge_limit_volt],
    [String.fromCodePoint(0x1F50B) + ' Battery', rtd.rt_battery_v],
    ['Nominal/Rated', rtd.rt_battery_rated_v],
  ];
  rows.sort(function(a, b) {
    return b[1] - a[1];
    // var v1 = Number(r1[1]);
    // var v2 = Number(r2[1]);
    // // console.log('sort r1, r2', r1, r2, v1, v2)
    // if(v1 < v2) return -1;
    // if(v1 > v2) return -1;
    // return 0;
  })
  dataTable.addRows(rows);
  options = {width: '100%'};
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
    redFrom: 0,
    redTo: 40,
    yellowFrom: 40,
    yellowTo: 50,
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
function updateTemperatureBatteryGauge() {
  var chart = getChart(".temp-battery-gauge", google.visualization.Gauge);
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
function updateTemperatureCaseGauge() {
  var chart = getChart(".temp-case-gauge", google.visualization.Gauge);
  //var element = $(".battery-volts-gauge");
  //var chart = new google.visualization.Gauge(element[0]);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["\xB0F", fahrenheit(latestData.controller_real_time_data.rt_case_temp)]
  ]);
  var values = [
    fahrenheit(latestData.controller_real_time_data.rt_battery_temp),
    fahrenheit(latestData.controller_settings.setting_battery_temp_warning_lower_limit),
    fahrenheit(latestData.controller_settings.setting_control_inner_temp_upper_limit),
    fahrenheit(latestData.controller_settings.setting_control_inner_temp_upper_limit_recover),
  ];

  var min = Math.min.apply(Math, values) - 25;
  var max = fahrenheit(latestData.controller_settings.setting_control_inner_temp_upper_limit);
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
    redFrom: fahrenheit(latestData.controller_settings.setting_control_inner_temp_upper_limit_recover),
    redTo: fahrenheit(latestData.controller_settings.setting_control_inner_temp_upper_limit),
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
function updateTemperaturePowerGauge() {
  var chart = getChart(".temp-power-gauge", google.visualization.Gauge);
  //var element = $(".battery-volts-gauge");
  //var chart = new google.visualization.Gauge(element[0]);
  var dataTable = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["\xB0F", fahrenheit(latestData.controller_real_time_data.rt_power_component_temp)]
  ]);
  var values = [
    fahrenheit(latestData.controller_real_time_data.rt_battery_temp),
    fahrenheit(latestData.controller_settings.setting_battery_temp_warning_lower_limit),
    fahrenheit(latestData.controller_settings.setting_power_component_temp_upper_limit),
    fahrenheit(latestData.controller_settings.setting_power_component_temp_upper_limit_recover),
  ];

  var min = Math.min.apply(Math, values) - 25;
  var max = fahrenheit(latestData.controller_settings.setting_power_component_temp_upper_limit);
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
    redFrom: fahrenheit(latestData.controller_settings.setting_power_component_temp_upper_limit_recover),
    redTo: fahrenheit(latestData.controller_settings.setting_power_component_temp_upper_limit),
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
function updateTemperatureBatteryRemoteGauge() {
  var chart = getChart(".temp-battery-remote-gauge", google.visualization.Gauge);
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
