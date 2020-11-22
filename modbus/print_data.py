#!/usr/bin/python
from common import *
print("#data")
client = getClient()
if client.connect():

    result = client.read_input_registers(0x3100, 19, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x3100 - 0x3118")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Charging equipment input voltage: {}".format(volts(result.registers[0])))
            print("Charging equipment input current: {}".format(amps(result.registers[1])))
            print("Charging equipment input power: {}".format(watts(result.registers[2], result.registers[3])))

            print("Charging equipment output voltage: {}".format(volts(result.registers[4])))
            print("Charging equipment output current: {}".format(amps(result.registers[5])))
            print("Charging equipment output power: {}".format(watts(result.registers[6], result.registers[7])))

            print("Discharging equipment output voltage: {}".format(volts(result.registers[12])))
            print("Discharging equipment output current: {}".format(amps(result.registers[13])))
            print("Discharging equipment output power: {}".format(watts(result.registers[14], result.registers[15])))

            print("Battery Temperature: {}".format(temperature(result.registers[16])))
            print("Temperature inside equipment: {}".format(temperature(result.registers[17])))
            print("Power components temperature: {}".format(temperature(result.registers[18])))
        else:
            print("Unable to read 0x3100 - 0x3112")

    result = client.read_input_registers(0x311A, 2, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x311A - 0x311B")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Battery SOC: {}".format(percent(result.registers[0])))
            print("Remote battery temperature: {}".format(temperature(result.registers[1])))
        else:
            print("Unable to read 0x311A - 0x311B")

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
