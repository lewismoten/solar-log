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
  return schema.addressDiscreteInputIds.indexOf(id) !== -1;
}
function canEdit(id) {
  return isCoil(id) || isHoldingRegister(id);
}
function isCoil(id) {
  return schema.addressCoilIds.indexOf(id) !== -1;
}
function isHoldingRegister(id) {
  return schema.addressHoldingRegisterIds.indexOf(id) !== -1;
}
function isBitAddress(id) {
  return isCoil(id) || isDiscreteInput(id);
}
function getRowAddress(row) {
    return '0x' + ('0000' + row.id.toString(16).toUpperCase()).substr(-4);
}
function getRowLabel(row) {
  var id = row.id;
  var meta = schema.addressById[id];
  return meta.label;
}
function getRowValue(row) {
  if(row.error) return 'ERR';
  var id = row.id;
  var meta = schema.addressById[id];
  var data = row.data;
  var value;

  if(isBitAddress(id)) {
    return data[0];
  } else if(meta.size) {
    if(meta.size === 1) value = data[0];
    else if(meta.size === 2) value = data[0] + (data[1] << 16);
    else if(data.length === 1) value = data[0];
  }
  if(meta.unit) {
    if(meta.size === 1) value = (value << 16) >> 16;
    var unit = schema.units[meta.unit];
    if(unit.scale) value /= unit.scale;
  }
  if(meta.packs) {
    function unpackValue(pack) {
      if("index" in pack) {
        return (data[pack.index] >> pack.shift) & pack.mask;
      }
      return (value >> pack.shift) & pack.mask;
    }
    return meta.packs.map(unpackValue);
  }
  return value;
}
function selectEnum(enums, value) {
  function getOption(key) {
    var option = '<option value=' + key;
    if(key === value.toString()) option += ' selected';
    return option + '>' + enums[key] + '</option>';
  }
  options = '<select>' + Object.keys(enums).map(getOption).join("") + '</select>';
  return options;
}
function input(value) {
  return '<input value="' + value + '" size="6">'
}
function getRowEdit(row) {
  if(!canEdit(row.id)) return '';
  if(row.error) return 'ERR';
  var value = getRowValue(row);
  var id = row.id;
  var meta = schema.addressById[id];
  var enums;
  if(meta.enum) enums = schema.enums[meta.enum];
  if(enums) {
    if(isBitAddress(id)) value = value ? "1" : "0"
    return selectEnum(enums, value);
  }
  if(meta.packs) {
    function unpackValue(result, pack, index) {
      var v = value[index];
      var key = pack.label;
      result[key] = input(v);
      if(pack.enum) {
        var enums = schema.enums[pack.enum];
        if(!enums) {
          result[key] = 'Missing: ' + pack.enum;
        } else {
          result[key] = selectEnum(enums, v);
        }
      }
      return result;
    }
    var packValues = meta.packs.reduce(unpackValue, {});
    return "<table>" + meta.packs.map(function(pack) {
      var label = pack.label;
      var input = packValues[label]
      return "<tr><td>" + label + "</td><td>" +  input + "</td></tr>";
    }).join("") + "</table>";
  }
  return input(value);
}
function getRowText(row) {
  if(row.error) return 'ERR';
  var value = getRowValue(row);
  var id = row.id;
  var meta = schema.addressById[id];
  var enums;
  if(meta.enum) enums = schema.enums[meta.enum];
  if(isBitAddress(id))
    return enums[value ? "1" : "0"]
  if(enums)
    return enums[value.toString()];
  if(meta.unit) {
    var unit = schema.units[meta.unit];
    if(unit.suffix) return [value, unit.suffix].join('');
  }
  if(meta.packs) {
    function unpackValue(result, pack, index) {
      var v = value[index];
      var key = pack.label;
      result[key] = v;
      if(pack.enum) {
        var enums = schema.enums[pack.enum];
        if(!enums) {
          result[key + '_enum'] = 'Missing' + pack.enum;
        } else {
          result[key + '_enum'] = enums[v.toString()];
        }
      }
      return result;
    }
    var packValues = meta.packs.reduce(unpackValue, {});
    switch(meta.type) {
      case "datetime":
        var theDate = new Date(
          packValues["Year"] + 2000,
          packValues["Month"] - 1,
          packValues["Day"],
          packValues["Hour"],
          packValues["Minute"],
          packValues["Second"]
        );
        var options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour12: true,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        };
        return theDate.toLocaleString(['en'], options)
      case "time":
        var theDate = new Date(
          packValues["Hour"],
          packValues["Minute"],
          packValues["Second"]
        );
        theDate.setHours(packValues["Hour"]);
        theDate.setMinutes(packValues["Minute"]);
        theDate.setSeconds(packValues["Second"]);
        var options = {
          hour12: true,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        };
        return theDate.toLocaleTimeString(['en'], options)
      case "duration":
        function minPadding(num, size) {
          var text = num.toString();
          if(text.length < size) {
            text = ('0000000000' + text).substr(-size);
          }
          return text
        }
        return [minPadding(packValues["Hours"], 2), minPadding(packValues["Minutes"], 2)].join(":");
    }
    return "<table>" + meta.packs.map(function(pack) {
      var label = pack.label;
      var value = packValues[label + '_enum'] || packValues[label]
      return "<tr><td>" + label + "</td><td>" +  value + "</td></tr>";
    }).join("") + "</table>";
  }
  return value;
}
function getRowUnit(row) {
  var id = row.id;
  var meta = schema.addressById[id];
  if(meta.unit) {
    var value = getRowValue(row);
    var unit = schema.units[meta.unit];
    if(value === 1 && unit.singular) return unit.singular;
    if(value !== 1 && unit.plural) return unit.plural;
    return unit.plural || unit.singular || unit.suffix || '';
  }
  if(meta.type) {
    return meta.type;
  }
  return '';
}
function getRowData(row) {
  if(row.error) return row.message || 'ERROR';
  return row.data;
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
      {name: 'data', title: 'Data', data: getRowData, defaultContent: ''},
      {name: 'value', title: 'Value', data: getRowValue},
      {name: 'unit', title: 'Unit', data: getRowUnit},
      {name: 'label', title: 'Label', data: getRowLabel},
      {name: 'text', title: 'Text', data: getRowText},
      {name: 'edit', title: 'Edit', data: getRowEdit}
    ]
  });

  return getSchema()
    // .then(getDevice)
    // .then(getInputRegisters)
    // .then(getCoils)
    // .then(getDiscreteInput)
    .then(getHoldingRegisters)
    .catch(showError);
}

function showError(error) {
  alert('error: ' + error);
  // if "unable to connect", make sure the world
  // still has permission to access the usb
  // (note: highly insecure...)
  // sudo chmod 777 /dev/ttyUSB0
}

function getSchema() {
  return $.getJSON("./schema.json")
     .then(gotSchema)
     .fail(getFailed)
}

function getDevice() {
  return $.getJSON("./print_device.py")
     .then(gotDevice)
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
function getHoldingRegisters() {
  return $.getJSON("./print_holding_registers.py")
     .then(gotAddresses)
     .fail(getFailed)
}

function getFailed(jqXHR, textStatus, errorThrown) {
  console.error(errorThrown);
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
  if(data.error) throw data.error;
  data.forEach(updateAddress);
  $(".data").DataTable().draw();
}
function gotDevice(data, textStatus, jqXHR) {
  if(data.error) throw data.error;
  var basic = "1";
  var regular = "0";
  if(data[regular].error) {
    message = data[regular].message||'error';
    $(".info0").text(message)
    $(".info1").text(message)
    $(".info2").text(message)
  } else {
    $(".info0").text(data[regular].data[0].ascii)
    $(".info1").text(data[regular].data[1].ascii)
    $(".info2").text(data[regular].data[2].ascii)
  }
  if(data[basic].error) {
    message = data[regular].message||'error';
    $(".info3").text(message)
  }else {
    $(".info3").text(data[basic].data[0].ascii)

  }
}
function gotSchema(data) {
  schema = data;
}
