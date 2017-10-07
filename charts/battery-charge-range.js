export {chart};

function chart(element) {
  var chart;
  var options = {
    vAxis: {
      title: 'Battery Charge Range'
    },
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
    data.addColumn("number", "Maximum");
    data.addColumn("number", "Battery");
    data.addColumn("number", "Minimum");
    data.addRows(records.map(mapRow));
    chart.draw(data, options);
  }

  function mapRow(record) {
    return [
      record._date,
      record["Battery Max. Voltage(V)"],
      record["Battery Voltage(V)"],
      record["Battery Min. Voltage(V)"]
    ];
  }
}
