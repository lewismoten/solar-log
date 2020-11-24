#!/usr/bin/python
import json
from common import *

def readDiscreteInput(addressInfo):
    id = addressInfo["id"]
    result = client.read_discrete_inputs(id, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        o = {"id": id, "error": True}
    else:
        if result.function_code < 0x80:
            o = {"id": id, "data": list(result.bits)}
        else:
            o = {"id": id, "error": True}
    return o

with open("address.json", "r") as f:
  address = json.load(f)

def asDiscreteInputWithData(id):
    return readDiscreteInput(address["byId"][str(id)]);

client = getClient()
if client.connect():
    out = list(map(asDiscreteInputWithData, address["discreteInputIds"]))
    client.close()
else:
    out = {"error": "unable to connect"}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
