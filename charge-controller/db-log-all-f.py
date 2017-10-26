#!/usr/bin/python
import json
import pymysql
from common import *

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
dataFormatters = {
    # Real-time data
    0x3100: volts,
    0x3101: amps,
    0x3102: watts,
    0x3104: volts,
    0x3105: amps,
    0x3106: watts,
    0x310C: volts,
    0x310D: amps,
    0x310E: watts,
    0x3110: temperature,
    0x3111: temperature,
    0x3112: temperature,
    0x311A: percent,
    0x311B: temperature,
    0x311D: volts
}



client = getClient()

def getError(value):
    return {} #{"error": str(value).encode("ascii")}

def getInfo(info):
    try:
        result = client.execute(ReadDeviceInformationRequest(info, unit=CHARGE_CONTROLLER_UNIT))
        if isinstance(result, Exception):
            result = client.execute(ReadDeviceInformationRequest(info, unit=CHARGE_CONTROLLER_UNIT))
            if isinstance(result, Exception):
                return getError(result)
        if result.function_code >= 0x80:
            return getError(result)
        return result.information
    except Exception as e:
        return getError(e)
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

# Get data / information from device
data = {}
info = {}
if client.connect():
    for start, end in pair(addresses):
        values = getValues(start, end)
        for address in range(start, end + 1):
            data[address] = values[address - start]
    client.close()
for address in dataFormatters:
    formatter = dataFormatters[address]
    if formatter == watts:
        data[address] = formatter(data[address], data[address + 1])
    else:
        data[address] = formatter(data[address])
    print(hex(address), data[address])
    '''
    result = getInfo(DeviceInformation.Basic)
    for key in result:
        info[key] = result[key].decode("ascii")

    result = getInfo(DeviceInformation.Regular)
    for key in result:
        info[key] = result[key].decode("ascii")
    '''
# Save our data into the database
'''
with open("db-config.json", "r") as f:
    db = json.load(f)

conn = pymysql.connect(
	db=db["db"],
	user=db["user"],
	password=db["password"],
	host=db["host"]
)

c = conn.cursor()
c.execute("INSERT INTO log (id) VALUES(NULL)")
c.execute("SELECT LAST_INSERT_ID()")
logId = c.fetchone()[0]
for id in info:
    c.execute("INSERT INTO info (log_id, id, value) VALUES(%s, %s, %s)", (logId, id, info[id]))
for id in data:
    c.execute("INSERT INTO data (log_id, id, value) VALUES(%s, %s, %s)", (logId, id, data[id]))
conn.commit()
c.close()
'''
