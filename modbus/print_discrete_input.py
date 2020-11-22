#!/usr/bin/python
import json
from common import *

def readDiscreteInput(addressInfo):
    result = client.read_discrete_inputs(addressInfo["id"], 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        addressInfo["error"] = true
        addressInfo["details"] = result
    else:
        addressInfo["function_code"] = result.function_code
        if result.function_code < 0x80:
            addressInfo["value"] = result.bits[0]
            addressInfo["text"] = addressInfo["options"][0] if result.bits[0] else addressInfo["options"][1]
        else:
            addressInfo["error"] = "Unable to read coil"
    return addressInfo

def isDiscreteInput(address):
    return address > 1000 and address < 20000

with open("address.json", "r") as f:
  address = json.load(f)

def asDiscreteInputWithData(id):
    return readDiscreteInput(address["byId"][str(id)]);

client = getClient()
if client.connect():
    mapped = map(asDiscreteInputWithData, filter(isDiscreteInput, address["allIds"]))
    print(json.dumps(list(mapped), indent=4))
    client.close()
else:
    print(json.dumps({"error": "unable to connect"}))
