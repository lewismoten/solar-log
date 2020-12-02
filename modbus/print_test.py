#!/usr/bin/python
from common import *
from pymodbus.other_message import ReportSlaveIdRequest, GetCommEventLogRequest, GetCommEventCounterRequest, ReadExceptionStatusRequest
from pymodbus.file_message import ReadFileRecordRequest
from pymodbus.pdu import ModbusRequest

client = getClient()
connected = client.connect()
if connected:
    print ("connected")
    try:
        result = client.execute(ReadFileRecordRequest(unit=unitId))
        # result = client.execute(ModbusRequest(unit=unitId))
        print("executed");
        if isinstance(result, Exception):
            print("result is Exception")
            print("{0}".format(result))
        else:
            print("got result")
            function_code = result.function_code;
            if result.function_code < 0x80:
                print("not a modbus exception")
                print("{0}".format(result))
            else:
                print("got modbus exception code")
                print(result.exception_code)
                print(modbusError(result.exception_code))
    except Exception as e:
        print("exception thrown")
        print("{0}".format(e))

    print("closing")
    client.close()
    print("closed")
else:
    print("not connected")
