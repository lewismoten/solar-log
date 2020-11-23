#!/usr/bin/python
import json
from common import *

def readCoil(addressInfo):
    result = client.read_coils(addressInfo["id"], 1, unit=CHARGE_CONTROLLER_UNIT)
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
            addressInfo["error"] = "Unable to read coil"
    return addressInfo

with open("address.json", "r") as f:
  address = json.load(f)

def asCoilWithData(id):
    return readCoil(address["byId"][str(id)]);

client = getClient()
connected = client.connect()
if connected:
    mapped = map(asCoilWithData, address["coilIds"])
    out = list(mapped)
    client.close()
else:
    out = {"error": "unable to connect", "connected": connected}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
