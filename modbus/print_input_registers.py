#!/usr/bin/python
import json
from common import *


def readInputRegister(addressInfo):
    id = addressInfo["id"]
    size = addressInfo["size"]
    result = client.read_input_registers(id, size, unit=schema["device"]["unit"])
    if isinstance(result, Exception):
        o = {"id": id, "error": True}
    else:
        if result.function_code < 0x80:
            o = {"id": id, "data": list(result.registers)}
        else:
            o = {"id": id, "error": True}
    return o

with open("schema.json", "r") as f:
  schema = json.load(f)

def asInputRegisterWithData(id):
    return readInputRegister(schema["addressById"][str(id)]);

client = getClient()
if client.connect():
    out = list(map(asInputRegisterWithData, schema["addressInputRegisterIds"]))
    client.close()
else:
    out = {"error": "unable to connect"}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
