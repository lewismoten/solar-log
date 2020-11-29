#!/usr/bin/python
import json
from common import *

with open("schema.json", "r") as f:
  schema = json.load(f)

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

def readCoil(addressInfo):
    id = addressInfo["id"]
    result = client.read_coils(id, 1, unit=schema["device"]["unit"])
    if isinstance(result, Exception):
        o = {"id": id, "error": True}
    else:
        if result.function_code < 0x80:
            o = {"id": id, "data": list(result.bits)}
        else:
            o = {"id": id, "error": True}
    return o

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

def readHoldingRegisters(addressInfo):
    id = addressInfo["id"]
    size = addressInfo["size"]
    result = client.read_holding_registers(id, size, unit=schema["device"]["unit"])
    if isinstance(result, Exception):
        o = {"id": id, "error": True}
    else:
        if result.function_code < 0x80:
            o = {"id": id, "data": list(result.registers)}
        else:
            o = {"id": id, "error": True}
    return o

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

def asInfoWithData(id):
    return readInfo(schema["infoById"][str(id)]);

def asInputRegisterWithData(id):
    return readInputRegister(schema["addressById"][str(id)]);

def asHoldingRegistersWithData(id):
    return readHoldingRegisters(schema["addressById"][str(id)]);

def asDiscreteInputWithData(id):
    return readDiscreteInput(schema["addressById"][str(id)]);

def asCoilWithData(id):
    return readCoil(schema["addressById"][str(id)]);

client = getClient()
connected = client.connect()
if connected:
    info = map(asInfoWithData, schema["allInfoIds"])
    a = map(asCoilWithData, schema["addressCoilIds"])
    b = map(asDiscreteInputWithData, schema["addressDiscreteInputIds"])
    c = map(asHoldingRegistersWithData, schema["addressHoldingRegisterIds"])
    d = map(asInputRegisterWithData, schema["addressInputRegisterIds"])
    out = {
        "info": list(info),
        "address": list(a) + list(b) + list(c) + list(d)
    }
    client.close()
else:
    out = {"error": "unable to connect", "connected": connected}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
