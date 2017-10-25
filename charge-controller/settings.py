#!/usr/bin/python
from common import *
print("#settings")
client = getClient()
if client.connect():
    result = client.read_holding_registers(0x9000, 15, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x9000 - 0x9014")
        print(result)
    else:
        if result.function_code < 0x80:
            batteryType = {
                0: "User defined",
                1: "Sealed",
                2: "GEL",
                3: "Flooded"
            }
            print("Battery Type: {}".format(batteryType.get(result.registers[0])))
            print("Battery Capacity: {}".format(ampHours(result.registers[1])))
            print("Temperature compensation coefficient: {}".format(coefficient(result.registers[2])))
            print("High Volt. disconnect: {}".format(volts(result.registers[3])))
            print("Charging limit voltage: {}".format(volts(result.registers[4])))
            print("Over voltage reconnect: {}".format(volts(result.registers[5])))
            print("Equalization voltage: {}".format(volts(result.registers[6])))
            print("Boost voltage: {}".format(volts(result.registers[7])))
            print("Float voltage: {}".format(volts(result.registers[8])))
            print("Boost reconnect voltage: {}".format(volts(result.registers[9])))
            print("Low voltage reconnect: {}".format(volts(result.registers[10])))
            print("Under voltage recover: {}".format(volts(result.registers[11])))
            print("Under voltage warning: {}".format(volts(result.registers[12])))
            print("Low voltage disconnect: {}".format(volts(result.registers[13])))
            print("Discharging limit voltage: {}".format(volts(result.registers[14])))

        else:
            print("Unable to read 0x9000 - 0x9014")

    result = client.read_holding_registers(0x9013, 15, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x9013 - 0x9021")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Real time clock: {}".format(getDateTime(result.registers[0], result.registers[1], result.registers[2])))
            print("Equalization charging cycle: {0}".format(days(result.registers[3])))
            print("Battery temperature warning upper limit: {}".format(temperature(result.registers[4])))
            print("Battery temperature warning lower limit: {}".format(temperature(result.registers[5])))
            print("Controller inner temperature upper limit: {}".format(temperature(result.registers[6])))
            print("Controller inner temperature upper limit recover: {}".format(temperature(result.registers[7])))
            print("Power component temperature upper limit: {}".format(temperature(result.registers[8])))
            print("Power component temperature upper limit recover: {}".format(temperature(result.registers[9])))
            print("Line Impedance: {}".format(milliohms(result.registers[10])))
            print("Night Time Threshold Volt.(NTTV): {}".format(volts(result.registers[11])))
            print("Light signal startup (night) delay time: {}".format(minutes(result.registers[12])))
            print("Day Time Threshold Volt.(DTTV): {}".format(volts(result.registers[13])))
            print("Light signal turn off(day) delay time: {}".format(minutes(result.registers[14])))
        else:
            print("Unable to read 0x9013 - 0x9021")

    result = client.read_holding_registers(0x903D, 3, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x903D - 0x903F")
        print(result)
    else:
        if result.function_code < 0x80:
            loadControllingMode = {
                0: "Manual Control",
                1: "Light ON/OFF",
                2: "Light ON+ Timer/",
                3: "Time Control"
            }
            print("Load controlling modes: {}".format(loadControllingMode.get(result.registers[0])))
            print("Working time length 1: {}".format(hourMinute(result.registers[1])))
            print("Working time length 2: {}".format(hourMinute(result.registers[2])))
        else:
            print("Unable to read 0x903D - 0x903F")

    result = client.read_holding_registers(0x9042, 12, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x9042 - 0x904D")
        print(result)
    else:
        if result.function_code < 0x80:

            result = client.read_holding_registers(0x9042, 12, unit=CHARGE_CONTROLLER_UNIT)
            print("Turn on timing 1: {}".format(getTime(result.registers[0], result.registers[1], result.registers[2])))
            print("Turn off timing 1: {}".format(getTime(result.registers[3], result.registers[4], result.registers[5])))
            print("Turn on timing 2: {}".format(getTime(result.registers[6], result.registers[7], result.registers[8])))
            print("Turn off timing 2: {}".format(getTime(result.registers[9], result.registers[10], result.registers[11])))
        else:
            print("Unable to read 0x9042 - 0x904D")

    result = client.read_holding_registers(0x9063, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x9063")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Backlight time: {0}".format(seconds(result.registers[0])))
        else:
            print("Unable to read 0x9063")

    result = client.read_holding_registers(0x9065, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x9065")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Length of night: {0}".format(hourMinute(result.registers[0])))
        else:
            print("Unable to read 0x9065")

    result = client.read_holding_registers(0x9067, 8, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x9067 - 0x906E")
        print(result)
    else:
        if result.function_code < 0x80:
            voltageCode = {
                0: "Auto Recognize",
                1: "12V",
                2: "24V"
            }
            print("Battery rated voltage code: {0}".format(voltageCode.get(result.registers[0])))
            loadTimingControlSelection = {
                0: "Using timer 1",
                1: "Using timer 2"
            }
            print("Load timing control selection: {}".format(loadTimingControlSelection.get(result.registers[2])))
            print("Default Load On/Off in manual mode: {}".format(onOff(result.registers[3])))
            print("Equalize Duration: {}".format(minutes(result.registers[4])))
            print("Boost Duration: {}".format(minutes(result.registers[5])))
            print("Discharge Percentage: {}".format(percent(result.registers[6])))
            print("Charging Percentage: {}".format(percent(result.registers[7])))
        else:
            print("Unable to read 0x9067 - 0x906E")


    result = client.read_holding_registers(0x9070, 1, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x9070")
        print(result)
    else:
        if result.function_code < 0x80:
            managementMode = {
                0: "Voltage compensation",
                1: "SOC"
            }
            print("Management modes for battery charging and discharging: {}".format(managementMode.get(result.registers[0])))
        else:
            print("Unable to read 0x9070")

    client.close()
