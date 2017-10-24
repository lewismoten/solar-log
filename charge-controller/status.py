#!/usr/bin/python
from common import *
client = getClient()
if client.connect():
    result = client.read_input_registers(0x3200, 3, unit=CHARGE_CONTROLLER_UNIT)
    if isinstance(result, Exception):
        print("Got exception reading 0x3200 - 0x3202")
        print(result)
    else:
        if result.function_code < 0x80:
            value = result.registers[0]
            batteryStatusVoltage = {
                0: "Normal",
                1: "Overvolt",
                2: "Under volt",
                3: "Low Volt Disconnect",
                4: "Fault"
            }
            batteryStatusTemperature = {
                0: "Normal",
                1: "Over Temperature",
                2: "Low Temperature"
            }
            abnormalStatus = {
                0: "Normal",
                1: "Abnormal"
            }
            wrongStatus = {
                0: "Correct",
                1: "Wrong"
            }
            print("Battery Status of Voltage: {}".format(batteryStatusVoltage.get(value & 0x0007, "Unexpected Value")))
            print("Battery Status of Temperature:  {}".format(batteryStatusTemperature.get((value >> 4) & 0x000f, "Unexpected Value")))
            print("Battery Status of Internal Resistance: {}".format(abnormalStatus.get((value >> 8) & 0x0001, "Unexpected Value")))
            print("Battery Status of Identification for rated voltage: {}".format(wrongStatus.get((value >> 15) & 0x0001, "Unexpected Value")))

            value = result.registers[1];
            chargingEquipmentStatusInputVoltage = {
                0: "Normal",
                1: "No power connected",
                2: "Higher Volt Input",
                3: "Input Volt Error"
            }
            chargingEquipmentStatusBattery = {
                0: "Not charging",
                1: "Float",
                2: "Boost",
                3: "Equalization"
            }
            faultStatus = {
                0: "Normal",
                1: "Fault"
            }
            runningStatus = {
                0: "Standby",
                1: "Running"
            }

            print("Charging Equipment Status of Input voltage: {}".format(chargingEquipmentStatusInputVoltage.get((value >> 14) & 0x0003, "Unexpected Value")))
            print("Charging Equipment Status of MOSFET is short: {}".format(yesNo((value >> 13) & 0x0001)))
            print("Charging Equipment Status of Charging or Anti-reverse MOSFET is short: {}".format(yesNo((value >> 12) & 0x0001)))
            print("Charging Equipment Status of Anti-reverse MOSFET is short.: {}".format(yesNo((value >> 11) & 0x0001)))
            print("Charging Equipment Status of Input is over current.: {}".format(yesNo((value >> 10) & 0x0001)))
            print("Charging Equipment Status of The load is over current.: {}".format(yesNo((value >> 9) & 0x0001)))
            print("Charging Equipment Status of The load is short.: {}".format(yesNo((value >> 8) & 0x0001)))
            print("Charging Equipment Status of Load MOSFET is short.: {}".format(yesNo((value >> 7) & 0x0001)))
            print("Charging Equipment Status of PV Input is short.: {}".format(yesNo((value >> 4) & 0x0001)))
            print("Charging Equipment Status of Battery: {}".format(chargingEquipmentStatusBattery.get((value >> 2) & 0x0003, "Unexpected Value")))
            print("Charging Equipment Status of Fault: {}".format(faultStatus.get((value >> 1) & 0x0001, "Unexpected Value")))
            print("Charging Equipment Status of Running: {}".format(runningStatus.get((value) & 0x0001, "Unexpected Value")))

            value = result.registers[2];
            dischargingEquipmentStatusVoltage = {
                0: "Normal",
                1: "Low",
                2: "High",
                3: "No access input volt error"
            }
            dischargingEquipmentStatusOutput = {
                0: "Light Load",
                1: "Moderate",
                2: "Rated",
                3: "Overload"
            }
            print("Discharging Equipment Status of Input Voltage: {}".format(dischargingEquipmentStatusVoltage.get((value >> 14) & 0x0003, "Unexpected Value")))
            print("Discharging Equipment Status of Output Power: {}".format(dischargingEquipmentStatusOutput.get((value >> 12) & 0x0003, "Unexpected Value")))
            print("Discharging Equipment Status of Short Circuit: {}".format(yesNo((value >> 11) & 0x0001)))
            print("Discharging Equipment Status of Unable to discharge: {}".format(yesNo((value >> 10) & 0x0001)))
            print("Discharging Equipment Status of Unable to stop discharging: {}".format(yesNo((value >> 9) & 0x0001)))
            print("Discharging Equipment Status of Output Voltage Abnormal: {}".format(yesNo((value >> 8) & 0x0001)))
            print("Discharging Equipment Status of Input overpressure: {}".format(yesNo((value >> 7) & 0x0001)))
            print("Discharging Equipment Status of High voltage side short circuit: {}".format(yesNo((value >> 6) & 0x0001)))
            print("Discharging Equipment Status of Boost Overpressure: {}".format(yesNo((value >> 5) & 0x0001)))
            print("Discharging Equipment Status of Output Overpressure: {}".format(yesNo((value >> 4) & 0x0001)))

            print("Discharging Equipment Status of Fault: {}".format(faultStatus.get((value >> 1) & 0x0001, "Unexpected Value")))
            print("Discharging Equipment Status of Running: {}".format(runningStatus.get(value & 0x0001, "Unexpected Value")))
        else:
            print("Unable to read 0x3200 - 0x3202")


    client.close()
