#!/usr/bin/python
import json
from common import *

def readInputRegister(addressInfo):
    id = addressInfo["id"]
    size = addressInfo["size"]
    result = client.read_input_registers(id, size, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        addressInfo["error"] = true
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
    mapped = map(asInputRegisterWithData, address["inputRegisterIds"])
    print(json.dumps(list(mapped), indent=4))
    client.close()
else:
    print(json.dumps({"error": "unable to connect"}))
