#!/usr/bin/python
from common import *
import json
import pymysql
#from time import sleep

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

#r = 0

#while True:
#    r += 1
#    print("Round {}".format(r))
data = {}
if client.connect():
    for start, end in pair(addresses):
        values = getValues(start, end)
        for address in range(start, end + 1):
            data[address] = values[address - start]
    client.close()

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
for id in data:
    c.execute("INSERT INTO data (log_id, id, value) VALUES(%s, %s, %s)", (logId, id, data[id]))
conn.commit()
c.close()
#sleep(10)
