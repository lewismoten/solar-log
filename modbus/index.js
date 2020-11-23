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
  var table = $(".data").DataTable({
    rowId: function(data) {
      return "row_" + data.id.toString()
    },
    columns: [
      {name: 'address', title: 'Address', data: 'id'},
      {name: 'label', title: 'Label', data: 'label'},
      {name: 'text', title: 'Text', data: 'text'}
    ]
  });

  return getInputRegisters().then(getCoils).then(getDiscreteInput);
}

function getCoils() {
  return $.getJSON("./print_coils.py")
     .then(gotAddresses)
     .fail(getFailed)
}

function getDiscreteInput() {
  return $.getJSON("./print_discrete_input.py")
     .then(gotAddresses)
     .fail(getFailed)
}
function getInputRegisters() {
  return $.getJSON("./print_input_registers.py")
     .then(gotAddresses)
     .fail(getFailed)
}

function getFailed(jqXHR, textStatus, errorThrown) {
  console.log(errorThrown);
}

function updateAddress(data) {
  var table = $(".data").DataTable();
  var row = table.row("#row_" + data.id.toString());
  if(row.length > 0) {
    row.data(data)
  } else {
    table.row.add(data);
  }
}
function gotAddresses(data, textStatus, jqXHR) {
  data.forEach(updateAddress);
  $(".data").DataTable().draw();
}
