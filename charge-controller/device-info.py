#!/usr/bin/python

from pymodbus.client.sync import ModbusSerialClient as ModbusClient
from pymodbus.mei_message import ReadDeviceInformationRequest
from pymodbus.constants import DeviceInformation
from common import *

client = ModbusClient(
    method = "rtu",
    port = "/dev/ttyUSB0",
    baudrate = 115200,
    timeout = 1
)

if client.connect():

    result = client.execute(ReadDeviceInformationRequest(DeviceInformation.Basic, unit=1))
    if isinstance(result, Exception):
        print("Got exception reading basic device information")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Company: {}".format(text(result.information[0])))
            print("Product: {}".format(text(result.information[1])))
            print("Version: {}".format(text(result.information[2])))

    result = client.execute(ReadDeviceInformationRequest(DeviceInformation.Regular, unit=1))
    if isinstance(result, Exception):
        print("Got exception reading regular device information")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Serial Number: {}".format(text(result.information[3])))

    client.close()
