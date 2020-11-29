#!/usr/bin/python
import json
from common import *

def readDiscreteInput(addressInfo):
    id = addressInfo["id"]
    result = client.read_discrete_inputs(id, 1, unit=schema["device"]["unit"])
    if isinstance(result, Exception):
        o = {"id": id, "error": True}
    else:
        if result.function_code < 0x80:
            o = {"id": id, "data": list(result.bits)}
        else:
            o = {"id": id, "error": True}
    return o

with open("schema.json", "r") as f:
  schema = json.load(f)

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
