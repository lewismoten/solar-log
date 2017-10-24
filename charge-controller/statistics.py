#!/usr/bin/python
from common import *
client = getClient()
if client.connect():
    result = client.read_input_registers(0x3300, 31, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x3300 - 0x331E")
        print(result)
    else:
        if result.function_code < 0x80:
            value = result.registers[0]
            print("Maximum input volt (PV) today: {}".format(volts(result.registers[0])))
            print("Minimum input volt (PV) today: {}".format(volts(result.registers[1])))
            print("Maximum battery volt today: {}".format(volts(result.registers[2])))
            print("Minimum battery volt today: {}".format(volts(result.registers[3])))
            print("Consumed energy today: {}".format(kilowattHour(result.registers[4], result.registers[5])))
            print("Consumed energy this month: {}".format(kilowattHour(result.registers[6], result.registers[7])))
            print("Consumed energy this year: {}".format(kilowattHour(result.registers[8], result.registers[9])))
            print("Total consumed energy: {}".format(kilowattHour(result.registers[10], result.registers[11])))
            print("Generated energy today: {}".format(kilowattHour(result.registers[12], result.registers[13])))
            print("Generated energy this month: {}".format(kilowattHour(result.registers[14], result.registers[15])))
            print("Generated energy this year: {}".format(kilowattHour(result.registers[16], result.registers[17])))
            print("Total generated energy: {}".format(kilowattHour(result.registers[18], result.registers[19])))
            print("Carbon dioxide reduction: {}".format(tons(result.registers[20], result.registers[21])))
            print("Battery Voltage: {}".format(volts(result.registers[26])))
            print("Battery Current: {}".format(bigAmps(result.registers[27], result.registers[28])))
            print("Battery Temp.: {}".format(temperature(result.registers[29])))
            print("Ambient Temp.: {}".format(temperature(result.registers[30])))

        else:
            print("Unable to read 0x3300 - 0x331E")


    client.close()
