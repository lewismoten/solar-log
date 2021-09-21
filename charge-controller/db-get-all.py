#!/usr/bin/python
import json
import pymysql

def json_serial(obj):
    return str(obj)

result = {"error": "unknown"}

try:
    with open("charge-controller.json", mode="r", encoding="utf-8") as data:
        chargeController = json.load(data)
    with open("db-config.json", "r") as f:
        db = json.load(f)

    conn = pymysql.connect(
    	db=db["db"],
    	user=db["user"],
    	password=db["password"],
    	host=db["host"]
    )

    c = conn.cursor()
    result = {}
    for tableName in chargeController["data"]:
        rowResult = {}
        sql = "SELECT * FROM %s where unit = 1 ORDER BY create_date DESC LIMIT 1" % tableName
        c.execute(sql)
        row = c.fetchone()
        fields = []
        for field in c.description:
            fields.append(field[0])
        for i in range(len(fields)):
            rowResult[fields[i]] = row[i]
        result[tableName] = rowResult

    conn.commit()
    c.close()
except Exception as e:
    result = {"error": str(e), "type": type(e)}

print("Content-Type: application/json")
print()
print(json.dumps(result, default=json_serial, sort_keys = True, indent = 2))
