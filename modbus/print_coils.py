#!/usr/bin/python
from common import *

def readCoil(addressInfo):
    id = addressInfo["id"]
    result = client.read_coils(id, 1, unit=unitId)
    if isinstance(result, Exception):
        o = {"id": id, "error": True}
    else:
        if result.function_code < 0x80:
            o = {"id": id, "data": list(result.bits)}
        else:
            o = {"id": id, "error": True}
    return o

def asCoilWithData(id):
    return readCoil(schema["addressById"][str(id)]);

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
