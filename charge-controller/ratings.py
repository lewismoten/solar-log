#!/usr/bin/python
from common import *
print("#ratings")
client = getClient()
if client.connect():
    result = client.read_input_registers(0x3000, 9, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x3000 - 0x3008")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Charging equipment rated input voltage: {}".format(volts(result.registers[0])))
            print("Charging equipment rated input current: {}".format(amps(result.registers[1])))
            print("Charging equipment rated input power: {}".format(watts(result.registers[2], result.registers[3])))

            print("Charging equipment rated output voltage: {}".format(volts(result.registers[4])))
            print("Charging equipment rated output current: {}".format(amps(result.registers[5])))
            print("Charging equipment rated output power: {}".format(watts(result.registers[6], result.registers[7])))

            chargingMode = {
                0: "Connect/Disconnect",
                1: "PWM",
                2: "MPPT"
            }
            print("Charging Mode: {}".format(chargingMode.get(result.registers[8], "Unknown")))
        else:
            print("Unable to read 0x3000 - 0x3008")

    result = client.read_input_registers(0x300E, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x300E")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Rated output current of load: {}".format(amps(result.registers[0])))
        else:
            print("Unable to read 0x300E")

    client.close()
