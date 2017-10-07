export {chart};

function chart(element) {
  var chart;
  var options = {
    title: 'Battery Temperature',
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
    data.addColumn("number", "℉");
    data.addColumn("number", "℃");
    data.addRows(records.map(mapRow));
    chart.draw(data, options);
  }

  function mapRow(record) {
    return [
      record._date,
      (record["Battery Temp.(℃)"] * (9/5)) + 32,
      record["Battery Temp.(℃)"]
    ];
  }
}
