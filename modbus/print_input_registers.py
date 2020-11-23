#!/usr/bin/python
import json
from common import *

def readInputRegister(addressInfo):
    id = addressInfo["id"]
    size = addressInfo["size"]
    result = client.read_input_registers(id, size, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        addressInfo["error"] = True
        addressInfo["details"] = result
    else:
        addressInfo["function_code"] = result.function_code
        if result.function_code < 0x80:
            format = addressInfo["format"]
            addressInfo["registers"] = list(result.registers)
            addressInfo["value"] = registersAsValue(result.registers, addressInfo)
            addressInfo["text"] = registersAsText(result.registers, addressInfo)
        else:
            addressInfo["error"] = "Unable to read input register"
    return addressInfo

with open("address.json", "r") as f:
  address = json.load(f)

def asInputRegisterWithData(id):
    return readInputRegister(address["byId"][str(id)]);

client = getClient()
if client.connect():
    out = list(map(asInputRegisterWithData, address["inputRegisterIds"]))
    client.close()
else:
    out = {"error": "unable to connect"}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
