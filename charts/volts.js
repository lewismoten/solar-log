export {Chart};

function Chart(element) {
  var chart;
  var options = {
    title: 'Volts',
    animation:{
        duration: 1000,
        easing: 'out'
      }
  };

  google.charts.load("current", {packages: ["corechart", "line"]});
  google.charts.setOnLoadCallback(setupChartAndData);

  this.draw = draw;

  function setupChartAndData() {
    chart = new google.visualization.LineChart(element);
  }

  function draw(records) {
    var data = new google.visualization.DataTable();
    data.addColumn("datetime", "Time of Day");
    data.addColumn("number", "Array");
    data.addColumn({
      type: "string",
      role: "annotation"
    });
    data.addColumn("number", "Load");
    data.addColumn("number", "Battery");
    data.addRows(records.map(mapRow));
    chart.draw(data, options);
  }

  function mapRow(record, index, records) {
    return [
      record._date,
      record["Array Voltage(V)"],
      getAnnotation("Array Status", record, index, records),
      record["Load Voltage(V)"],
      record["Battery Voltage(V)"]
    ];
  }

  function getAnnotation(name, record, index, records) {
    var value = record[name];
    return (index === 0 || records[index - 1][name] !== value) ? value : null;
  }
}
