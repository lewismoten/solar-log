#!/usr/bin/python
from common import *

def readInfo(info):
    id = info["id"]
    function_code = 'none'
    try:
        result = client.execute(ReadDeviceInformationRequest(id, unit=unitId))
        if isinstance(result, Exception):
            o = {"id": id, "error": True, "message": "{0}".format(result)}
        else:
            function_code = result.function_code;
            if result.function_code < 0x80:
                def asText(index):
                    return {"index": index, "ascii": result.information[index].decode("ascii")}
                o = {"id": id, "data": list(map(asText, result.information))}
            else:
                o = {"id": id, "error": True, "code": result.exception_code, "message": modbusError(result.exception_code)}
    except Exception as e:
        o = {"id": id, "error": True, "message": "{0}".format(e), "function_code": function_code}

    return o

def asInfoWithData(id):
    item = {"id": id, "error": True}
    for x in range(RETRY_COUNT):
        item = readInfo(schema["infoById"][str(id)]);
        if stopTrying(item): break
    return item;


client = getClient()
connected = client.connect()
if connected:
    mapped = map(asInfoWithData, schema["allInfoIds"])
    out = list(mapped)
    client.close()
else:
    out = {"error": "unable to connect", "connected": connected}

print("Content-Type: application/json")
print()
print(json.dumps(out, indent=2))
