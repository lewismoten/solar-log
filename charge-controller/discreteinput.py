#!/usr/bin/python
from common import *
client = getClient()
if client.connect():

    result = client.read_discrete_inputs(0x2000, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x2000")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Over temperature inside device: {}".format("Higher than over-temperature protection point" if result.getBit(0) else "Normal"))
        else:
            print("Unable to read coil 0x2000")

    result = client.read_discrete_inputs(0x200C, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x200C")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Day/Night: {}".format("Night" if result.getBit(0) else "Day"))
        else:
            print("Unable to read coil 0x200C")

    client.close()
