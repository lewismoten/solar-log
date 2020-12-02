#!/usr/bin/python
from common import *

def readHoldingRegisters(addressInfo):
    id = addressInfo["id"]
    size = addressInfo["size"]
    function_code = 'none'
    try:
        result = client.read_holding_registers(id, size, unit=unitId)
        if isinstance(result, Exception):
            o = {"id": id, "error": True, "message": "{0}".format(result)}
        else:
            function_code = result.function_code;
            if result.function_code < 0x80:
                o = {"id": id, "data": list(result.registers)}
            else:
                o = {"id": id, "error": True, "code": result.exception_code, "message": modbusError(result.exception_code)}
    except Exception as e:
        o = {"id": id, "error": True, "message": "{0}".format(e), "function_code": function_code}
    return o

def asHoldingRegistersWithData(id):
    item = {"id": id, "error": True}
    for x in range(RETRY_COUNT):
        item = readHoldingRegisters(schema["addressById"][str(id)]);
        if stopTrying(item): break
    return item;

client = getClient()
if client.connect():
    out = list(map(asHoldingRegistersWithData, schema["addressHoldingRegisterIds"]))
    client.close()
else:
    out = {"error": "unable to connect"}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
