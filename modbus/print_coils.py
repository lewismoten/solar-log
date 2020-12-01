#!/usr/bin/python
from common import *

def readCoil(addressInfo):
    id = addressInfo["id"]
    function_code = 'none'
    try:
        result = client.read_coils(id, 1, unit=unitId)
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

def asCoilWithData(id):
    item = {"id": id, "error": True}
    for x in range(RETRY_COUNT):
        item = readCoil(schema["addressById"][str(id)]);
        if not "error" in item: break
    return item;

client = getClient()
connected = client.connect()
if connected:
    mapped = map(asCoilWithData, schema["addressCoilIds"])
    out = list(mapped)
    client.close()
else:
    out = {"error": "unable to connect", "connected": connected}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
