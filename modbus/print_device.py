#!/usr/bin/python
import json
from common import *

def readInfo(info):
    id = info["id"]
    result = client.execute(ReadDeviceInformationRequest(id, unit=schema["device"]["unit"]))
    if isinstance(result, Exception):
        o = {"id": id, "error": True}
    else:
        if result.function_code < 0x80:
            def asText(index):
                return {"index": index, "ascii": result.information[index].decode("ascii")}
            o = {"id": id, "data": list(map(asText, result.information))}
        else:
            o = {"id": id, "error": True}
    return o

with open("schema.json", "r") as f:
  schema = json.load(f)

def asInfoWithData(id):
    return readInfo(schema["infoById"][str(id)]);

client = getClient()
connected = client.connect()
if connected:
    mapped = map(asInfoWithData, schema["allInfoIds"])
    out = list(mapped)
    client.close()
else:
    out = {"error": "unable to connect", "connected": connected}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
