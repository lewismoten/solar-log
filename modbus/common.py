#!/usr/bin/python
import ctypes
import datetime
import json

from pymodbus.client.sync import ModbusSerialClient as ModbusClient
from pymodbus.exceptions import ModbusIOException
from pymodbus.mei_message import ReadDeviceInformationRequest
from pymodbus.constants import DeviceInformation

with open("schema.json", "r") as file:
  schema = json.load(file)
unitId = schema["device"]["unit"]

def getClient():
    return ModbusClient(
        method = schema["device"]["method"],
        port = schema["device"]["port"],
        baudrate = schema["device"]["baudrate"],
        timeout = schema["device"]["timeout"]
    )

def pair(array):
    array = iter(array)
    while True:
        yield next(array), next(array)
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
def percentValue(register):
    return value16(register) * 100;
def percentText(register):
    return "{}%".format(percentValue(register))
def milliohms(value):
    return "{} milliohms".format(value16(value))
def yesNo(value, *bits):
    return 'Yes' if value else 'No'
def onOff(value, *bits):
    return 'On' if value else 'Off'
def enableDisable(value, *bits):
    return 'Enabled' if value else 'Disabled'
def dayNight(value, *bits):
    return 'Night' if value else 'Day'
def getDateTime(secondMinute, hourDay, monthYear):
    sm = value8(secondMinute)
    hd = value8(hourDay)
    my = value8(monthYear)
    return datetime.datetime(2000 + my[0], my[1], hd[0], hd[1], sm[0], sm[1])
def valueRaw(value): return value
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
def chargingModeText(mode):
    return {
        0: "Connect/Disconnect",
        1: "PWM",
        2: "MPPT"
    }[mode]

def bitsAsText(bits, meta):
    return {
        'yes': yesNo,
        'enabled': enableDisable,
        'day': dayNight,
        'on': onOff
    }[meta["format"]](*bits)

def nothing(*x): return '';

def registersAsValue(registers, meta):
    def asMaskValue(mask):
        return ((registers[0] >> mask["shift"]) & mask["mask"])
    def valueMasks(*x):
        return list(map(asMaskValue, meta["masks"]));
    return {
        'amp': value16,
        'amp2': value32,
        'volt': value16,
        'watt': value32,
        'kWh': value32,
        'temperature': value16,
        "percent": percentValue,
        'charging mode': valueRaw,
        'ton': value32,
        'mask': valueMasks
    }[meta["format"]](*registers)

def addressLabels(registers, meta):
    def asMaskLabel(mask): return mask['label']
    return list(map(asMaskLabel, meta['masks'])) if meta['format'] == 'mask' else ''

def registersAsText(registers, meta):
    def asMaskText(mask):
        return mask["enum"][str((registers[0] >> mask["shift"]) & mask["mask"])]
    def textMasks(*x):
        return list(map(asMaskText, meta["masks"]));
    return {
        'amp': amps,
        'amp2': bigAmps,
        'volt': volts,
        'watt': watts,
        'kWh': kilowattHour,
        'temperature': temperature,
        'percent': percentText,
        'charging mode': chargingModeText,
        'ton': tons,
        'mask': textMasks
    }[meta["format"]](*registers)
