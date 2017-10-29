#!/usr/bin/python
from pymodbus.client.sync import ModbusSerialClient as ModbusClient
from pymodbus.exceptions import ModbusIOException
from pymodbus.mei_message import ReadDeviceInformationRequest
from pymodbus.constants import DeviceInformation

# make sure you are connected...
# dmesg | grep ttyUSB

client = ModbusClient(
    method = "rtu",
    port = "/dev/ttyUSB0",
    baudrate = 115200,
    timeout = 1
)

if client.connect():
    result = client.read_input_registers(0x3000, 1, unit=1)
    if isinstance(result, Exception):
        print("got exption")
        print(result)
    elif result.function_code >= 0x80:
        print("got bad function code")
        print(result.function_code)
        print(result)
    else:
        print("worked")
        print(result.registers)
    client.close()
else:
    print("unable to connect")
print("done")
