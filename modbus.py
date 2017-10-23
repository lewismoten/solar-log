#!/usr/bin/python
import cgitb
cgitb.enable()
# -*- coding: UTF-8 -*-

import logging
import logging.handlers as handlers
logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)


from pymodbus.client.sync import ModbusSerialClient as ModbusClient
client = ModbusClient(
    method = 'rtu',
    port = '/dev/ttyUSB0',
    baudrate = 115200,
    timeout = 1
)
def getShort(high, low):
    return (high << 8) + low

try:
    connected = client.connect()
    print(connected)
    if connected:

        print("---------[ Rated data (read only) input register ]---------")
        result = client.read_input_registers(0x3000, 9, unit=1)
        print("PV array rated voltage: {} volts".format(result.registers[0] / 100))
        print("PV array rated current: {} amps".format(result.registers[1] / 100))
        print("PV array rated power: {} watts".format(getShort(result.registers[3], result.registers[2]) / 100));
        print("Battery's Voltage: {} volts".format(result.registers[4] / 100));
        print("Rated charging current to battery: {} amps".format(result.registers[5] / 100));
        print("Rated charging power to battery: {} watts".format(getShort(result.registers[7], result.registers[6]) / 100));
        print("0001H-PWM: {}".format(result.registers[8]))
        result = client.read_input_registers(0x300E, 1, unit=1)
        print("Rated output current of load: {} amps".format(result.registers[0] / 100))


        print("---------[ Real-time data (read only) input register ]---------")
        result = client.read_input_registers(0x3100, 19, unit=1)

        print("Solar charge controller--PV array voltage: {} volts".format(float(result.registers[0] / 100.0)))
        print("Solar charge controller--PV array current: {} volts".format(float(result.registers[1] / 100.0)))
        print("Solar charge controller--PV array power: {} watts".format(getShort(result.registers[3], result.registers[2])/100))
        print("Battery voltage: {} volts".format(result.registers[4] / 100.0))
        print("Battery charging current: {} amps".format(result.registers[5] / 100.0))
        print("Battery charging power: {} watts".format(getShort(result.registers[7], result.registers[6])))
        #3108 - unknown
        #3109 - unknown
        #310A - unknown
        #310B - unknown
        print("Load voltage: {} volts".format(result.registers[12] / 100))
        print("Load current: {} amps".format(result.registers[13] / 100))
        print("Load power: {} watts".format(getShort(result.registers[15], result.registers[14])/100))
        c = result.registers[16] / 100
        print("Battery temperature: {} degree Celsius".format(c))
        print("Battery temperature: {} degree Fahrenheit".format(c * 9/5 + 32))
        c = result.registers[17] / 100
        print("Temperature inside case: {} degree Celsius".format(c))
        print("Temperature inside case: {} degree Fahrenheit".format(c * 9/5 + 32))
        c = result.registers[18] / 100
        print("Heat sink surface temperature of equipments' power components: {} degree Celsius".format(c))
        print("Heat sink surface temperature of equipments' power components: {} degree Fahrenheit".format(c * 9/5 + 32))
        #3113-3119 - unknown

        result = client.read_input_registers(0x311A, 2, unit=1)
        print("Battery SOC: {}%".format(result.registers[0]/100))
        c = result.registers[1] / 100
        print("Remote battery temperature: {} degree Celsius".format(c))
        print("Remote battery temperature: {} degree Fahrenheit".format(c * 9/5 + 32))
        #311C - unknown
        result = client.read_input_registers(0x311D, 1, unit=1)
        print("Battery's real rated power: {} volts".format(result.registers[0]/100))

        print("---------[ Real-time status (read only) input register ]---------")
        result = client.read_input_registers(0x3200, 2, unit=1)
        '''
            D3-D0: 01H Overvolt, 00H Normal , 02H Under Volt, 03H Low Volt Disconnect, 04H Fault
            D7-D4: 00H Normal, 01H Over Temp.(Higher than the warning settings), 02H Low Temp.(Lower than the warning settings),
            D8: Battery inerternal resistance abnormal 1, normal 0
            D15: 1-Wrong identification for rated voltage
        '''
        # REVIEW: http://www.solarpoweredhome.co.uk/1733_modbus_protocol.pdf
        # TODO: This is wrong! Map bits instead. Multiple status packed in data. (voltage, temperature, internal resistance flag, and wrong identification)
        batteryStatus = {
            0:"Normal",
            1:"Overvolt",
            2:"Undervolt",
            3:"Low Volt Disconnect",
            4:"Fault"
        }
        print("Battery Status: {}".format(batteryStatus.get(result.registers[0], "unknown")))

        '''
        D15-D14: Input volt status. 00 normal, 01 no power connected, 02H Higher volt input, 03H Input volt error.
        D13: Charging MOSFET is short.
        D12: Charging or Anti-reverse MOSFET is short.
        D11: Anti-reverse MOSFET is short.
        D10: Input is over current.
        D9: The load is Over current.
        D8: The load is short.
        D7: Load MOSFET is short.
        D4: PV Input is short.
        D3-2: Charging status. 00 No charging,01 Float,02 Boost,03 Equlization.
        D1: 0 Normal, 1 Fault.
        D0: 1 Running, 0 Standby.
        '''
        # TODO: Unpack bits
        print("Charging equipment status: {}".format(result.registers[1]))

        print(client.close())
except Exception as e:
    print(e)

print("done")
