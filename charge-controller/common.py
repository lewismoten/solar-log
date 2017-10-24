#!/usr/bin/python
import ctypes
import datetime

from pymodbus.client.sync import ModbusSerialClient as ModbusClient
from pymodbus.exceptions import ModbusIOException
from pymodbus.mei_message import ReadDeviceInformationRequest
from pymodbus.constants import DeviceInformation

CHARGE_CONTROLLER_UNIT = 1

def getClient():
    return ModbusClient(
        method = "rtu",
        port = "/dev/ttyUSB0",
        baudrate = 115200,
        timeout = 1
    )

def value32(low, high):
    return ctypes.c_int(low + (high << 16)).value / 100
def value16(value):
    return ctypes.c_short(value).value / 100
def value8(value):
    return [value >> 8, value & 0xFF]
def text(value):
    return value.decode("ascii")
def volts(value):
    return "{} Volts".format(value16(value))
def amps(value):
    return "{} Amps".format(value16(value))
def bigAmps(low, high):
    return "{} Amps".format(value32(low, high))
def ampHours(value):
    return "{} Amp Hours".format(value)
def watts(low, high):
    return "{} Watts".format(value32(low, high))
def kilowattHour(low, high):
    return "{} Kilowatt Hours".format(value32(low, high))
def tons(low, high):
    return "{} Tons".format(value32(low, high))
def temperature(value):
    c = value16(value);
    #return "{}°C".format(c)
    f = c * 9/5 + 32;
    return "{}°F".format(f)
def coefficient(value):
    return "{} mV/°C/2V".format(value16(value))
def percent(value):
    return "{}%".format(value16(value) * 100)
def milliohms(value):
    return "{} milliohms".format(value16(value))
def yesNo(value):
    values = {
        0: "No",
        1: "Yes"
    }
    return values.get(value, "Unexpected Value")
def onOff(value):
    values = {
        0: "Off",
        1: "On"
    }
    return values.get(value, "Unexpected Value")
def getDateTime(secondMinute, hourDay, monthYear):
    sm = value8(secondMinute)
    hd = value8(hourDay)
    my = value8(monthYear)
    return datetime.datetime(2000 + my[0], my[1], hd[0], hd[1], sm[0], sm[1])
def days(value):
    return "{} Days".format(value)
def minutes(value):
    return "{} Minutes".format(value)
def seconds(value):
    return "{} Seconds".format(value)
def hourMinute(value):
    hm = value8(value)
    return "{0} hours {1} minutes".format(hm[0], hm[1]);
def getTime(second, minute, hour):
    return datetime.time(hour, minute, second)
