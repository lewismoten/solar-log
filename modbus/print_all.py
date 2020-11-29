#!/usr/bin/python
from common import *

# Prints a condensed output of all data available
# Front-end uses the same schema file to read data
# {
#   info: {
#       [infoId]: {
#            [index]: [bytes...],
#            [index]: [bytes...],
#       },
#       [infoId]: {
#            [index]: [bytes...],
#            [index]: [bytes...],
#       }
#   },
#   address: {
#       [id]: bit, # coil
#       [id]: bit, # discrete input
#       [id]: [bytes...], # input register
#       [id]: [bytes...] # holding register
#   }
#}

out = {
    "info": {},
    "address": {}
}

def readCoil(id):
    result = client.read_coils(id, 1, unit=unitId)
    appendAddressBit(id, result)

def readDiscreteInput(id):
    result = client.read_discrete_inputs(id, 1, unit=unitId)
    appendAddressBit(id, result)

def readHoldingRegisters(id):
    size = schema["addressById"][str(id)]["size"]
    result = client.read_holding_registers(id, size, unit=unitId)
    appendAddressWord(id, result)

def readInputRegister(id):
    size = schema["addressById"][str(id)]["size"]
    result = client.read_input_registers(id, size, unit=unitId)
    appendAddressWord(id, result)

def readInfo(id):
    result = client.execute(ReadDeviceInformationRequest(id, unit=unitId))
    if isinstance(result, Exception):
        addInfoError(id)
    else:
        if gotResult(result):
            parts = {}
            out["info"][str(id)] = {}
            for index in result.information:
                out["info"][str(id)][str(index)] = list(result.information[index])
        else:
            addInfoError(id)

def appendAddressBit(id, result):
    if isinstance(result, Exception):
        addAddressError(id)
    else:
        if gotResult(result):
            out["address"][id] = result.bits[0]
        else:
            addAddressError(id)

def appendAddressWord(id, result):
    if isinstance(result, Exception):
        addAddressError(id)
    else:
        if gotResult(result):
            out["address"][id] = list(result.registers)
        else:
            addAddressError(id)

def gotResult(result):
  return result.function_code < 0x80

def addAddressError(id):
  out["address"][str(id)] = getError()

def addInfoError(id):
  out["info"][str(id)] = getError()

def getError(reason=True):
    return {"error": reason}

client = getClient()
connected = client.connect()
if connected:
    # TODO: only read data requested via query string
    # TODO: read multiple sequential addresses at once
    # TODO: Retry with collisions and timeouts
    for id in schema["allInfoIds"]: readInfo(id)
    for id in schema["addressCoilIds"]: readCoil(id)
    for id in schema["addressDiscreteInputIds"]: readDiscreteInput(id)
    for id in schema["addressHoldingRegisterIds"]: readHoldingRegisters(id)
    for id in schema["addressInputRegisterIds"]: readInputRegister(id)
    client.close()
else:
    out = getError("unable to connect")

print("Content-Type: application/json")
print()
print(json.dumps(out))
