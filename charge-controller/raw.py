#!/usr/bin/python
from common import *
'''
addresses = [

    # Coils (1 bit, read/write)
    0x0000, 0x0000,
    0x0002, 0x0006,
    0x0013, 0x0014,
    0x0016, 0x0016,
    0x0020, 0x0020,

    # Descrete Inputs (1 bit, read-only)
    0x2000, 0x2001,
    0x2009, 0x2009,
    0x200C, 0x200C,

    # Input Registers (16 bit, read-only)
    ## Rated Data
    0x3000, 0x3008,
    0x300E, 0x300E,
    ## Real-Time Data
    0x3100, 0x3113,
    0x311A, 0x311B,
    0x311D, 0x311D,
    0x31A0, 0x31AB,
    0x31AD, 0x31B6,
    ## Real-Time Status
    0x3200, 0x3202,
    0x3204, 0x3204,
    ## Statistics
    0x3300, 0x331E,

    # Holding Registers (16 bit, read/write)
    ## Settings
    0x9000, 0x900E,
    0x9013, 0x9021,
    0x903D, 0x9040,
    0x9042, 0x904D,
    0x905A, 0x905C,
    0x9063, 0x9063,
    0x9065, 0x9065,
    0x9067, 0x9081,
    0x9090, 0x9098,
    0x9100, 0x9105,
    0x9180, 0x9181,
    0x9183, 0x9183
]
'''
addresses = [
    ## Real-Time Data
    0x3100, 0x3113,
    0x311A, 0x311B,
    0x311D, 0x311D,
    0x31A0, 0x31AB,
    0x31AD, 0x31B6,
    ## Real-Time Status
    0x3200, 0x3202,
    0x3204, 0x3204,
]

client = getClient()
def pair(array):
    array = iter(array)
    while True:
        yield next(array), next(array)
def readHolding(address, count=1):
    #0x3xxx
    return client.read_holding_registers(address, count, unit=CHARGE_CONTROLLER_UNIT)
def readInput(address, count=1):
    #0x9xxx
    return client.read_input_registers(address, count, unit=CHARGE_CONTROLLER_UNIT)
def readDescrete(address, count=1):
    #0x2xxx
    return client.read_discrete_inputs(address, count, unit=CHARGE_CONTROLLER_UNIT)
def readCoils(address, count=1):
    #0x0xxx
    return client.read_coils(address, count, unit=CHARGE_CONTROLLER_UNIT)
def readRegisters(address, count=1):
    if address < 0x2000:
        return readCoils(address, count)
    elif address < 0x3000:
        return readDescrete(address, count)
    elif address < 0x9000:
        return readInput(address, count)
    else:
        return readHolding(address, count)

def getValue(address, count=1):
    result = readRegisters(address, count)
    if isinstance(result, Exception):
        # try again...
        result = readRegisters(address, count)
        if isinstance(result, Exception):
            return [str(result)] * count
    if result.function_code >= 0x80:
        return [str(result)] * count
    if address < 0x3000:
        return result.bits
    else:
        return result.registers
def getValues(addressStart, addressEnd):
    return getValue(addressStart, (addressEnd - addressStart) + 1)
def getInfo(info):
    try:
        result = client.execute(ReadDeviceInformationRequest(info, unit=CHARGE_CONTROLLER_UNIT))
        if isinstance(result, Exception):
            result = client.execute(ReadDeviceInformationRequest(info, unit=CHARGE_CONTROLLER_UNIT))
            if isinstance(result, Exception):
                return {"error": str(result).encode("ascii")}
        if result.function_code >= 0x80:
            return {"error": str(result).encode("ascii")}
        return result.information
    except Exception as e:
        return {"error": str(e).encode("ascii")}
import json
data = {}
if client.connect():

    '''
    # Reading device info takes a long time.

    result = getInfo(DeviceInformation.Basic)
    for key in result:
        data["info{}".format(key)] = result[key].decode("ascii")

    result = getInfo(DeviceInformation.Regular)
    for key in result:
        data["info{}".format(key)] = result[key].decode("ascii")
    '''
    for start, end in pair(addresses):
        values = getValues(start, end)
        for address in range(start, end + 1):
            data[hex(address)[2:].upper().ljust(4, '0')] = values[address - start]
    client.close()
print(json.dumps(data, indent=4, sort_keys=True))
