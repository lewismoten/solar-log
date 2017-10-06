var log;
var logFilter;

//2017/2/16  6:27:0 should be 2017/10/4  8:12:0


/*
"Record Num.": "287",
    "Array Current(A) ": "0.00",
    "Array Voltage(V)": "3.78",
    "Array Power(W)": "0.00",
    "Load Current(A)": "0.00",
    "Load Voltage(V)": "13.27",
    "Load Power(W)": "0.00",
    "Battery Current(A)": "0.00",
    "Battery Voltage(V)": "13.27",
    "Battery Temp.(℃)": "25.00",
    "Battery SOC(%)": "80",
    "Battery Max. Voltage(V)": "14.39",
    "Battery Min. Voltage(V)": "13.2",
    "Array Status": "CutOut",
    "Charging Status": "NotCharging",
    "Battery Status": "Normal",
    "Load Status": "On",
    "Device Status": "Normal",
    "Daily Energy Consumed(kWh)": "0.00",
    "Monthly Energy Consumed(kWh)": "0.00",
    "Annual Energy Consumed(kWh)": "0.01",
    "Total Energy Consumed(kWh)": "0.01",
    "Daily Energy Generated(kWh)": "0.11",
    "Monthly Energy Generated(kWh)": "0.49",
    "Annual Energy Generated(kWh)": "1.15",
    "Total Energy Generated(kWh)": "2.42"
*/
$(document).ready(function() {
  $(".choose-set").change(function() {
    logFilter = $(this).val();
    drawBasic();
  });
  $.ajax("solar4.csv")
    .done(function(data) {
       var lines = data.split("\r\n");
       var headers = lines.shift().split(",").map(function(header){
         return header.trim();
       });
       headers.push("timestamp");

       // device sometimes adds duplicate header
       while(lines[0].indexOf("Record Num") === 0) {
         lines.shift();
       }

       lines.pop(); // last line has nada

      // Convert to object
      log = lines.map(function(line) {
        var record = {};
        var values = line.split(",");
        headers.forEach(function(header, i) {
          record[header] = values[i];

          if(header === "timestamp") {
            record[header] = tsAsDate(values[i], values[0]);
            record.date = parseDate(record[header]);
          }
        });

        return record;
      });
      headers.push("date");
      //log.sort(sortLog);

      setupDates();

      google.charts.load("current", {packages: ["corechart", "line", "timeline", "gauge"]});
      google.charts.setOnLoadCallback(drawBasic);

    });
});

function drawBasic() {
  drawGauges();
  drawAmps();
  drawVolts();
  drawWatts();
  drawBattery();
  drawBatterySoc();
  drawStatus();
}

function drawAmps() {
  var data = new google.visualization.DataTable();
  data.addColumn("number", "id");
  data.addColumn("number", "Solar");
  data.addColumn("number", "Load");
  data.addColumn("number", "Battery");
  data.addRows(log.filter(isVisible).map(function(line) {
    return [
      Number(line["Record Num."]),
      Number(line["Array Current(A)"]),
      Number(line["Load Current(A)"]),
      Number(line["Battery Current(A)"])
    ];
  }));

  var options = {
    hAxis: {
      title: 'Record'
    },
    vAxis: {
      title: 'Amps'
    }
  };
  var chart = new google.visualization.LineChart(document.getElementById('chart_amps'));
  chart.draw(data, options);
}

function drawVolts() {
  var data = new google.visualization.DataTable();
  data.addColumn("number", "id");
  data.addColumn("number", "Solar");
  data.addColumn("number", "Load");
  data.addColumn("number", "Battery");
  data.addRows(log.filter(isVisible).map(function(line) {
    return [
      Number(line["Record Num."]),
      Number(line["Array Voltage(V)"]),
      Number(line["Load Voltage(V)"]),
      Number(line["Battery Voltage(V)"])
    ];
  }));

  var options = {
    hAxis: {
      title: 'Record'
    },
    vAxis: {
      title: 'Voltage'
    }
  };
  var chart = new google.visualization.LineChart(document.getElementById('chart_volts'));
  chart.draw(data, options);
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
function drawWatts() {
  var data = new google.visualization.DataTable();
  data.addColumn("number", "id");
  data.addColumn("number", "Solar");
  data.addColumn("number", "Load");
  data.addRows(log.filter(isVisible).map(function(line) {
    return [
      Number(line["Record Num."]),
      Number(line["Array Power(W)"]),
      Number(line["Load Power(W)"])
    ];
  }));

  var options = {
    hAxis: {
      title: 'Record'
    },
    vAxis: {
      title: 'Watts'
    }
  };
  var chart = new google.visualization.LineChart(document.getElementById('chart_watts'));
  chart.draw(data, options);
}

function drawBattery() {
  var data = new google.visualization.DataTable();
  data.addColumn("number", "id");
  data.addColumn("number", "Minimum");
  data.addColumn("number", "Battery");
  data.addColumn("number", "Maximum");
  data.addRows(log.filter(isVisible).map(function(line) {
    return [
      Number(line["Record Num."]),
      Number(line["Battery Min. Voltage(V)"]),
      Number(line["Battery Voltage(V)"]),
      Number(line["Battery Max. Voltage(V)"])
    ];
  }));

  var options = {
    hAxis: {
      title: 'Record'
    },
    vAxis: {
      title: 'Voltage'
    }
  };
  var chart = new google.visualization.LineChart(document.getElementById('chart_battery'));
  chart.draw(data, options);
}

function drawBatterySoc() {
  var data = new google.visualization.DataTable();
  data.addColumn("number", "id");
  data.addColumn("number", "Charge");
  data.addRows(log.filter(isVisible).map(function(line) {
    return [
      Number(line["Record Num."]),
      Number(line["Battery SOC(%)"])
    ];
  }));

  var options = {
    hAxis: {
      title: 'Record'
    },
    vAxis: {
      title: '%'
    }
  };
  var chart = new google.visualization.LineChart(document.getElementById('chart_battery_soc'));
  chart.draw(data, options);
}

function drawStatus() {
  var data = new google.visualization.DataTable();
  data.addColumn({ type: 'string', id: 'Type' });
  data.addColumn({ type: 'string', id: 'Name' });
  data.addColumn({ type: 'date', id: 'Start' });
  data.addColumn({ type: 'date', id: 'End' });
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
     log.filter(isVisible).map(function(line, i) {
       var timestamp = line["timestamp"];

       if (line[name] !== state[1]) {
         state = [type, line[name], timestamp, timestamp];
         rows.push(state);
       } else {
         if (timestamp > state[2]) {
           state[3] = timestamp;
         } else {
           console.log(type, i, "warning - end date is wrong!");
         }
       }
     });
     return rows;
   }

  var options = {
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

function tsAsDate(ts, id) {
  if(ts === "" || typeof ts === "undefined") {
    // older entries didn't have dates - oops
    return new Date(0, 0, 0, 0, id * 10, 0);
  }
  // 2017/2/14  12:11:0
  var parts = ts.split("  ");
  var d = parts[0].split("/");
  var t = parts[1].split(":");
  var year = Number(d[0]);
  var month = Number(d[1]);
  var day = Number(d[2]);
  var hour = Number(t[0]);
  var min = Number(t[1]);
  var sec = Number(t[2]);
  var date = new Date(year, month - 1, day, hour, min, sec);

  date = fixMyDate(date, id);
  return date;
}

function fixMyDate(date, id) {
  // I've gone in and changed the date a few times to get it setup.
  // Let's update the older dates to be correct
  if (id < 66) {
    // for some reson day of month did not roll over
    date.setDate(date.getDate()-1);
  }

  if (id < 295) {
    // set time ahead a few months (2017/2/16  6:27:0 should be 2017/10/4  8:12:0)
    date.setMilliseconds(date.getMilliseconds() + 19874700000);
  }

  date.setHours(date.getHours() + 12);
  
  return date;
}

function sortLog(a, b) {
  var aa = a.timestamp;
  var bb = b.timestamp;
  if (aa < bb) {
    return - 1;
  } else if (aa > bb) {
    return 1;
  } else {
    return 0;
  }
}
function getValue(line, name) {
  var i = headers.indexOf(name);
  return Number(line.split(",")[i]);
}
function parseDate(ts) {
  return monthName(ts.getMonth()) + " " + ts.getDate() + ", " + ts.getFullYear();
}
function monthName(num) {
  return [
    "Jan", "Feb", "Mar",
    "Apr", "May", "Jun",
    "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec"
  ][num];
}
function isVisible(record) {
  return typeof logFilter === "undefined" || logFilter === "" || record.date === logFilter;
}
function setupDates() {
  $(".choose-set").append(log.reduce(uniqueDates, []).map(mapOption));
  function mapOption(text) {
    return $("<option>").val(text).text(text);
  }
  function uniqueDates(dates, record) {
    var date = record.date;
    if(dates.indexOf(date) === -1) {
      dates.push(date);
    }
    return dates;
  }
}
