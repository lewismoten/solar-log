#!/usr/bin/python
import json
import pymysql

def json_serial(obj):
    return str(obj)

result = {"error": "unknown"}

try:
    with open("charge-controller.json", mode="r", encoding="utf-8") as data:
        chargeController = json.load(data)
    with open("db-config.json", mode="r", encoding="utf-8") as f:
        db = json.load(f)

    conn = pymysql.connect(
    	db=db["db"],
    	user=db["user"],
    	password=db["password"],
    	host=db["host"]
    )

    c = conn.cursor()
    result = {"hour": []}
    for tableName in chargeController["data"]:
        if tableName == "controller_real_time_data" or tableName == "controller_real_time_status":
            rowResult = {}
            sql = "SELECT * FROM %s ORDER BY create_date DESC LIMIT 1" % tableName
            c.execute(sql)
            row = c.fetchone()
            fields = []
            for field in c.description:
                fields.append(field[0])
            for i in range(len(fields)):
                rowResult[fields[i]] = row[i]
            result[tableName] = rowResult

    # Get a brief history...
    # Get {maxRecords} records representing the past {durationMiutes} minutes, grouped by {groupSeconds}
    maxRecords = 100
    durationMinutes = 60
    groupSeconds = (durationMinutes * 60) / (maxRecords - 1)

    sql = """
    SELECT
        DATE_FORMAT(FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(create_date)/{groupSeconds}) * {groupSeconds}), '%Y-%m-%d %H:%i:%s'),
        AVG(rt_input_v),
        AVG(rt_input_a),
        AVG(rt_input_w),
        AVG(rt_battery_v),
        AVG(rt_battery_a),
        AVG(rt_battery_w),
        AVG(rt_battery_soc) * 100,
        (AVG(rt_battery_temp) * (9/5)) + 32,
        AVG(rt_load_v),
        AVG(rt_load_a),
        AVG(rt_load_w)
    FROM
        controller_real_time_data
    WHERE
        create_date >= DATE_SUB(NOW(), INTERVAL {duration} MINUTE)
    GROUP BY
        FLOOR(UNIX_TIMESTAMP(create_date)/{groupSeconds})
    ORDER BY create_date;
    """
    c.execute(sql.format(**{"groupSeconds": groupSeconds, "duration": durationMinutes}))
    result["hour_fields"] = [
        "create_date",
        "rt_input_v",
        "rt_input_a",
        "rt_input_w",
        "rt_battery_v",
        "rt_battery_a",
        "rt_battery_w",
        "rt_battery_soc",
        "rt_battery_temp",
        "rt_load_v",
        "rt_load_a",
        "rt_load_w"
    ]
    for row in c:
        result["hour"].append(row)


    conn.commit()
    c.close()
except Exception as e:
    result = {"error": str(e), "type": type(e)}

print("Content-Type: application/json")
print()
print(json.dumps(result, default=json_serial, sort_keys = True, indent = 2))
