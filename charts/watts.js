export {chart};

function chart(element) {
  var chart;
  var options = {
    title: 'Watts',
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
    data.addColumn("number", "Solar");
    data.addColumn("number", "Load");
    data.addRows(records.map(mapRow));
    chart.draw(data, options);
  }

  function mapRow(record) {
    return [
      record._date,
      record["Array Power(W)"],
      record["Load Power(W)"]
    ];
  }
}
