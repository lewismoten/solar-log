#!/usr/bin/python
import json
import pymysql

def json_serial(obj):
    return str(obj)

result = {"error": "unknown"}

try:
    with open("../db-config.json", mode="r", encoding="utf-8") as f:
        db = json.load(f)
    conn = pymysql.connect(
    	db=db["db"],
    	user=db["user"],
    	password=db["password"],
    	host=db["host"]
    )
    c = conn.cursor()
    parms = {}
    with open("../sql/controller-real-time-status.sql", mode="r", encoding="utf-8") as f:
        sql = f.read();
    c.execute(sql.format(**parms))
    result = {}
    result["data"] = list(c);
    conn.commit()
    c.close()
    result["fields"] = [
        "create_date",
        "rt_battery_status",
        "rt_charging_equipment_status",
        "rt_discharging_equipment_status"
    ]
except Exception as e:
    result = {"error": str(e), "type": type(e)}

print("Content-Type: application/json")
print()
print(json.dumps(result, default=json_serial, sort_keys = True, indent = 2))
