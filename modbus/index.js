loadingStarted();

var schema;

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
function isDiscreteInput(id) {
  return schema.discreteInputIds.indexOf(id) !== -1;
}
function isCoil(id) {
  return schema.coilIds.indexOf(id) !== -1;
}
function isBitAddress(id) {
  return isCoil(id) || isDiscreteInput(id);
}
function getRowAddress(row) {
    return '0x' + ('0000' + row.id.toString(16).toUpperCase()).substr(-4);
}
function getRowLabel(row) {
  var id = row.id;
  var meta = schema.byId[id];
  return meta.label;
}
function getRowValue(row) {
  var id = row.id;
  var meta = schema.byId[id];
  var data = row.data;

  if(isBitAddress(id)) {
    return data[0];
  } else if(meta.size) {
    if(meta.size === 1) value = data[0];
    else if(meta.size === 2) value = data[0] + (data[1] << 16);
    else if(data.length === 1) value = data[0];
  }
  if(meta.unit) {
    var unit = schema.units[meta.unit];
    if(unit.scale) value /= unit.scale;
  }
  if(meta.packs) {
    function unpackValue(pack) {
      return (value >> pack.shift) & pack.mask;
    }
    return meta.packs.map(unpackValue);
  }
  return value;
}
function selectEnum(enums, value) {
  function getOption(key) {
    var option = '<option value=' + key;
    if(key === (value ? "1" : "0")) option += ' selected';
    return option + '>' + enums[key] + '</option>';
  }
  options = '<select>' + Object.keys(enums).map(getOption).join("") + '</select>';
  return options;
}
function getRowText(row) {
  var value = getRowValue(row);
  var id = row.id;
  var meta = schema.byId[id];
  if(isBitAddress(id)) {
    var enums = schema.enums[meta.enum];
    if(isCoil(id)) {
      return selectEnum(enums, value);
    }
    return enums[value ? "1" : "0"]
  }
  if(meta.enum) {
    return schema.enums[meta.enum][value.toString()];
  }
  if(meta.unit) {
    var unit = schema.units[meta.unit];
    if(unit.suffix) return [value, unit.suffix].join('');
  }
  if(meta.packs) {
    function unpackValue(pack, index) {
      var v = value[index];
      var enums = schema.enums[pack.enum];
      return "<tr><td>" + pack.label + "</td><td>" + enums[v.toString()] + "</td></tr>";
    }
    return "<table>" + meta.packs.map(unpackValue).join("") + "</table>";
  }
  return value;
}
function getRowUnit(row) {
  var id = row.id;
  var meta = schema.byId[id];
  if(meta.unit) {
    var unit = schema.units[meta.unit];
    if(value === 1 && unit.singular) return unit.singular;
    if(value !== 1 && unit.plural) return unit.plural;
    return unit.plural || unit.singular || unit.suffix || '';
  }
  return '';
}
function documentReady() {
  var table = $(".data").DataTable({
    paging: false,
    rowId: function(data) {
      return "row_" + data.id.toString()
    },
    columns: [
      {name: 'address', title: 'Address', data: getRowAddress},
      {name: 'id', title: '(decimal)', data: 'id'},
      {name: 'data', title: 'Data', data: 'data'},
      {name: 'value', title: 'Value', data: getRowValue},
      {name: 'unit', title: 'Unit', data: getRowUnit},
      {name: 'label', title: 'Label', data: getRowLabel},
      {name: 'text', title: 'Text', data: getRowText}
    ]
  });

  return getSchema().then(getInputRegisters).then(getCoils).then(getDiscreteInput);
}

function getSchema() {
  return $.getJSON("./address.json")
     .then(gotSchema)
     .fail(getFailed)
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
function gotSchema(data) {
  schema = data;
}