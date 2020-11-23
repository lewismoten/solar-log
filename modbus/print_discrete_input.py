#!/usr/bin/python
import json
from common import *

def readDiscreteInput(addressInfo):
    result = client.read_discrete_inputs(addressInfo["id"], 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        addressInfo["error"] = True
        addressInfo["details"] = result
    else:
        addressInfo["function_code"] = result.function_code
        if result.function_code < 0x80:
            addressInfo["bits"] = list(result.bits)
            format = addressInfo["format"]
            addressInfo["value"] = result.bits[0]
            addressInfo["text"] = bitsAsText(result.bits, addressInfo)
        else:
            addressInfo["error"] = "Unable to read discrete input"
    return addressInfo

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
