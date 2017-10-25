#!/usr/bin/python
from common import *
print("#device")
client = getClient()
if client.connect():

    result = client.execute(ReadDeviceInformationRequest(DeviceInformation.Basic, unit=CHARGE_CONTROLLER_UNIT))
    if isinstance(result, Exception):
        print("Got exception reading basic device information")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Company: {}".format(text(result.information[0])))
            print("Product: {}".format(text(result.information[1])))
            print("Version: {}".format(text(result.information[2])))

    result = client.execute(ReadDeviceInformationRequest(DeviceInformation.Regular, unit=CHARGE_CONTROLLER_UNIT))
    if isinstance(result, Exception):
        print("Got exception reading regular device information")
        print(result)
    else:
        if result.function_code < 0x80:
            print("Serial Number: {}".format(text(result.information[3])))

    client.close()
