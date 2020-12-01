#!/usr/bin/python
from common import *

def readInputRegister(addressInfo):
    id = addressInfo["id"]
    size = addressInfo["size"]
    function_code = 'none'
    try:
        result = client.read_input_registers(id, size, unit=unitId)
        if isinstance(result, Exception):
            o = {"id": id, "error": True, "message": "{0}".format(result)}
        else:
            function_code = result.function_code;
            if result.function_code < 0x80:
                o = {"id": id, "data": list(result.registers)}
            else:
                o = {"id": id, "error": True}
    except Exception as e:
        o = {"id": id, "error": True, "message": "{0}".format(e), "function_code": function_code}

    return o

def asInputRegisterWithData(id):
    return readInputRegister(schema["addressById"][str(id)]);

client = getClient()
if client.connect():
    out = list(map(asInputRegisterWithData, schema["addressInputRegisterIds"]))
    client.close()
else:
    out = {"error": "unable to connect"}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
