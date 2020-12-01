#!/usr/bin/python
from common import *

def readDiscreteInput(addressInfo):
    id = addressInfo["id"]
    function_code = 'none'
    try:
        result = client.read_discrete_inputs(id, 1, unit=unitId)
        if isinstance(result, Exception):
            o = {"id": id, "error": True, "message": "{0}".format(result)}
        else:
            function_code = result.function_code;
            if result.function_code < 0x80:
                o = {"id": id, "data": list(result.bits)}
            else:
                o = {"id": id, "error": True, "message": "Invalid function code: {0}".format(function_code)}
    except Exception as e:
        o = {"id": id, "error": True, "message": "{0}".format(e), "function_code": function_code}
    return o

def asDiscreteInputWithData(id):
    return readDiscreteInput(schema["addressById"][str(id)]);

client = getClient()
if client.connect():
    out = list(map(asDiscreteInputWithData, schema["addressDiscreteInputIds"]))
    client.close()
else:
    out = {"error": "unable to connect"}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
