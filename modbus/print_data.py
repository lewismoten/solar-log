#!/usr/bin/python
from common import *
print("#data")
client = getClient()
if client.connect():

    result = client.read_input_registers(0x311D, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x311D")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Battery's real rated power: {}".format(volts(result.registers[0])))
        else:
            print("Unable to read 0x311D")

    client.close()
