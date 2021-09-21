#!/usr/bin/python
from pymodbus.client.sync import ModbusSerialClient as ModbusClient
from pymodbus.exceptions import ModbusIOException
from pymodbus.mei_message import ReadDeviceInformationRequest
from pymodbus.constants import DeviceInformation
from datetime import datetime

# make sure you are connected...
# dmesg | grep ttyUSB


units = [1, 2, 3];

for UNIT in units:

    print("----[ UNIT:", UNIT,"]----------");

    client = ModbusClient(
        method = "rtu",
        port = "/dev/ttyUSB0",
        baudrate = 115200,
        timeout = 1.5
    )


    if client.connect():
        print("Reading Real-Time Clock from device...")
        result = client.read_holding_registers(0x9013, 3, unit=UNIT)
        if isinstance(result, Exception):
            print("got exception")
            print(result)
        elif result.function_code >= 0x80:
            print("got bad function code")
            print(result.function_code)
            print(result)
        else:
            print("... Date({}, {}, {}, {}, {}, {})".format(
                2000 + (result.registers[2] >> 8),
                result.registers[2] & 0xFF,
                result.registers[1] >> 8,
                result.registers[1] & 0xFF,
                result.registers[0] >> 8,
                result.registers[0] & 0xFF
            ))

            print("Today is ...")
            # Local time
            now = datetime.now()
            print("... {}".format(now))
            newData = [0,0,0]
            newData[2] = ((now.year - 2000) << 8) + now.month
            newData[1] = (now.day << 8) + now.hour
            newData[0] = (now.minute << 8) + now.second
            print("... Date({}, {}, {}, {}, {}, {})".format(
                2000 + (newData[2] >> 8),
                newData[2] & 0xFF,
                newData[1] >> 8,
                newData[1] & 0xFF,
                newData[0] >> 8,
                newData[0] & 0xFF
            ))

            print("Updating Device RTC...")
            result = client.write_registers(0x9013, newData, unit=UNIT)
            if isinstance(result, Exception):
                print("got exception")
                print(result)
            elif result.function_code >= 0x80:
                print("got bad function code")
                print(result.function_code)
                print(result)
            else:
                print("... RTC clock update command successful")

            print("Verifying...")
            result = client.read_holding_registers(0x9013, 3, unit=UNIT)
            if isinstance(result, Exception):
                print("got exception")
                print(result)
            elif result.function_code >= 0x80:
                print("got bad function code")
                print(result.function_code)
                print(result)
            else:
                print("... Date({}, {}, {}, {}, {}, {})".format(
                    2000 + (result.registers[2] >> 8),
                    result.registers[2] & 0xFF,
                    result.registers[1] >> 8,
                    result.registers[1] & 0xFF,
                    result.registers[0] >> 8,
                    result.registers[0] & 0xFF
                ))


        client.close()
    else:
        print("unable to connect")
print("---- [ done ] --------")
