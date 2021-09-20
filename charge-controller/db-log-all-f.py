#!/usr/bin/python
import json
from common import *

with open("charge-controller.json", "r") as data:
    chargeController = json.load(data)
def getType(name):
    d = {}
    d.update(chargeController["types"][name])
    if not "type" in d and not name is "default":
        d["type"] = "default"
    if "type" in d:
        s = getType(d["type"])
        s.update(d)
        return s
    return d

def getRecord(record):
    if not "type" in record:
        record["type"] = "default"
    t = getType(record["type"])
    t.update(record);
    return t;

def getValue(record, unit):
    address = int(record["address"], 0x10)
    size = record["size"]
    values = [];
    vv = ""
    for startAddress in bulkAddresses:
        for currentAddress in range(startAddress, startAddress + bulkAddresses[startAddress]["size"]):
            if currentAddress == address:
                for i in range(size):
                  values.append(bulkAddresses[startAddress]["data" + str(unit)][currentAddress - startAddress + i])
    if "parts" in record:
        partedValues = {}
        for part in record["parts"]:
            partedValues[part["name"]] = (values[part["part"]] >> part["shift"]) & part["mask"]
            # if "enum" in part:
            #     partedValues.append("{}: {}".format(name, part["enum"][v]))
            # else:
            #     partedValues.append("{}: {}".format(name, v))
        if record["type"] == "datetime":
            return datetime.datetime(
                2000 + partedValues["year"],
                partedValues["month"],
                partedValues["day"],
                partedValues["hour"],
                partedValues["minute"],
                partedValues["second"]
            )
        if record["type"] == "time":
            return datetime.time(
                partedValues["hour"],
                partedValues["minute"],
                partedValues["second"]
            )
        if record["type"] == "timedelta":
            return datetime.timedelta(
                0, #days
                0, #seconds
                0, #microseconds
                0, #milliseconds
                partedValues["minutes"],
                partedValues["hours"],
                0 #weeks
            )
        return values[0] #store raw value
        #return partedValues
    elif "enum" in record:
        return values[0]#record["enum"][values[0]]
    else:
        if record["size"] == 2:
            value = ctypes.c_int(values[0] + (values[1] << 16)).value
        else:
            value = ctypes.c_short(values[0]).value
        value = value * record["multiplier"]
        return value

def readHolding(address, count=1, unit=CHARGE_CONTROLLER_UNIT):
    return client.read_holding_registers(address, count, unit=unit)
def readInput(address, count=1, unit=CHARGE_CONTROLLER_UNIT):
    return client.read_input_registers(address, count, unit=unit)
def readDescrete(address, count=1, unit=CHARGE_CONTROLLER_UNIT):
    return client.read_discrete_inputs(address, count, unit=unit)
def readCoils(address, count=1, unit=CHARGE_CONTROLLER_UNIT):
    return client.read_coils(address, count, unit=unit)
def readControllerData(address, count=1, unit=CHARGE_CONTROLLER_UNIT):
    if address < 0x2000:
        result = readCoils(address, count, unit)
    elif address < 0x3000:
        result = readDescrete(address, count, unit)
    elif address < 0x9000:
        result = readInput(address, count, unit)
    else:
        result = readHolding(address, count, unit)
    if not isinstance(result, Exception) and result.function_code < 0x80:
        return result.bits if address < 0x3000 else result.registers
    else:
        return [0xFFFF] * count;

addresses = [];

# Load up all meta data and determine what addresses we need
for data in chargeController["data"]:
    if data == "controller_real_time_data" or data == "controller_real_time_status":
        for record in chargeController["data"][data]:
            r = getRecord(record);
            record.update(r)
            #record["size"] = r["size"]
            addresses.append(int(r["address"], 0x10))
            n = r["size"]
            for i in range(1, n):
                addresses.append(int(r["address"], 0x10) + i)

# lets get ready to build our queries
addresses.sort()
bulkAddresses = {}
#unit=CHARGE_CONTROLLER_UNIT

size = 1
lastAddress = 0xFFFF
startAddress = 0xFFFF
units = [1, 2]

for address in addresses:
    if address == lastAddress + 1:
        lastAddress = address
        size = size + 1
        bulkAddresses[startAddress]["size"] = size
    else:
        size = 1
        lastAddress = address
        startAddress = address
        bulkAddresses[startAddress] = {
          "size": size
        }

# request data from charge controller
client = getClient()
if client.connect():
    for key in sorted(bulkAddresses.keys()):
        for UNIT in units:
            bulkAddresses[key]["data" + str(UNIT)] = readControllerData(key, bulkAddresses[key]["size"], UNIT)
    client.close()

import pymysql

with open("db-config.json", "r") as f:
    db = json.load(f)
conn = pymysql.connect(db=db["db"],user=db["user"],password=db["password"],host=db["host"])
c = conn.cursor()

for UNIT in units:
    for data in chargeController["data"]:
        if data == "controller_real_time_data" or data == "controller_real_time_status":
            sqlFields = []
            sqlTags = []
            sqlValues = []

            #table_sql = "CREATE TABLE IF NOT EXISTS " + data + " (\n\tid INT UNSIGNED NOT NULL AUTO_INCREMENT,\n\tcreate_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,unit INT NOT NULL DEFAULT 1,\n"
            sqlFields.append("unit");
            sqlTags.append("%s");
            sqlValues.append(UNIT);

            for record in chargeController["data"][data]:
                #dbtype = "FLOAT"
                #if "dbtype" in record:
                #    dbtype = record["dbtype"]
                #table_sql = table_sql + "\t" + record["field"] + " " + dbtype + ",\n"
                sqlFields.append(record["field"])
                sqlTags.append("%s")
                sqlValues.append(getValue(record, UNIT))

            #table_sql = table_sql + "\tINDEX (create_date),\n\tPRIMARY KEY(id)\n);\n\n"
            #dropSql = "drop table if exists " + data
            #print(dropSql)
            #c.execute(dropSql);
            #print(table_sql)
            #c.execute(table_sql)
            sql = "INSERT INTO " + data + " (" + ", ".join(sqlFields) + ") VALUES (" + ", ".join(sqlTags) + ")"
            c.execute(sql, sqlValues)
            conn.commit()
c.close()



    #print(sql)

# store data in database
#print("done")
