export {Chart};

function Chart(element) {
  var chart;
  var options = {
    title: 'Total Daily Energy',
    animation:{
        duration: 1000,
        easing: 'out'
      },
    width: "100%"
  };

  google.charts.load("current", {packages: ["corechart", "bar"]});

  this.draw = draw;
  /*
  Daily Energy Consumed(kWh)
  Monthly Energy Consumed(kWh)
  Annual Energy Consumed(kWh)
  Total Energy Consumed(kWh)

  Daily Energy Generated(kWh)
  Monthly Energy Generated(kWh)
  Annual Energy Generated(kWh)
  Total Energy Generated(kWh)
  */
  function draw(records) {
    var data = new google.visualization.DataTable();
    data.addColumn("datetime", "Time of Day");
    data.addColumn("number", "Generated");
    data.addColumn("number", "Consumed");
    data.addRows(records.filter(isLastInHour).map(mapRow));
    if (chart) {
      chart.draw(data, options);
    } else {
      google.charts.setOnLoadCallback(function() {
        chart = new google.visualization.ColumnChart(element);
        chart.draw(data, options);
      })
    }
  }

  function mapRow(record, index, records) {
    var ts = record._ts.clone();
    ts.startOf("hour");
    return [
      ts.toDate(),
      record["Daily Energy Generated(kWh)"],
      record["Daily Energy Consumed(kWh)"]
    ];
  }

  function isLastInHour(record, index, records) {
    if (index < records.length - 1) {
      var nextRecord = records[index + 1];
      var ts = record._ts.clone();
      var tsNext = nextRecord._ts.clone();
      ts.endOf("hour");
      tsNext.endOf("hour");
      return !ts.isSame(tsNext);
    } else {
      return true;
    }
  }
}
