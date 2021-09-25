#!/usr/bin/python

# Temperature Sensor
# XY-MD02

import ctypes
from pymodbus.client.sync import ModbusSerialClient as ModbusClient

print("XY-MD02 Temperature and Humidity Sensor")

client = ModbusClient(
    method = "rtu",
    port = "/dev/ttyUSB1", # or /dev/ttyUSB0
    baudrate = 9600,
    timeout = 1
)

connexted = client.connect()

if connected:
    result = client.read_input_registers(0x0001, 2, unit=1)
    if isinstance(result, Exception):
        print("Unable to read input register address 0x0001 of 2 bytes from unit 1")
        print(result)
    else:
        if result.function_code < 0x80:
            print("got registers")
            print(result.registers)
            temperatureValue = ctyeps.c_short(result.registers[0]).value
            print("Temperature Value", temperatureValue)
            temperatureCelcius = temperatureValue / 10
            print("Temperature Celcius", temperatureCelcius)
            temperatureFahrenheight = temperatureCelcius * 9/5 + 32
            print("Temperature Fahrenheight", temperatureFahrenheight)
        else:
            print("Got faulty function code")
            print(result.function_code)
    client.close()
else:
    print("Not connected")

print()
print("done")
