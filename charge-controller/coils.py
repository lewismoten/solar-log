#!/usr/bin/python
from common import *
client = getClient()
if client.connect():

    result = client.read_coils(2, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading coil 2")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Manual control the load: {}".format(onOff(result.bits[0])))
        else:
            print("Unable to read coil 2")

    result = client.read_coils(3, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading coil 3")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Default control the load: {}".format(onOff(result.bits[0])))
        else:
            print("Unable to read coil 3")

    result = client.read_coils(5, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading coil 5")
        print(result)
    else:
        if result.function_code < 0x80:
            enableStatus = {
                0: "disabled",
                1: "enabled"
            }
            print("Enable load test mode: {}".format(enableStatus.get(result.bits[0], "Unexpected Value")))
        else:
            print("Unable to read coil 5")

    result = client.read_coils(6, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading coil 6")
        print(result)
    else:
        if result.function_code < 0x80:
            turnStatus = {
                0: "Turn off (used for temporary test of the load)",
                1: "Turn on"
            }
            print("Force the load: {}".format(turnStatus.get(result.bits[0], "Unexpected Value")))
        else:
            print("Unable to read coil 6")

    client.close()
