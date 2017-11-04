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
        if tableName == "controller_real_time_data" or tableName == "controller_real_time_status" or tableName == "controller_settings":
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
    secondsInADay = 24 * 60 * 60
    maxRecords = 60//86400
    durationMinutes = 60
    groupSeconds = (durationMinutes * 60) / (maxRecords - 1)
    parms = {"groupSeconds": groupSeconds, "duration": durationMinutes, "decimals": 2, "day": secondsInADay}
    #result["parms"] = parms

    # handle 11:59 pm to 12:01 am (rite now appears on same date with modulous rollver)
    #        --FLOOR((FLOOR(UNIX_TIMESTAMP(create_date) / {day}) * {day}) + (FLOOR((UNIX_TIMESTAMP(create_date) % {day})/{groupSeconds}) * {groupSeconds})),
    # --GROUP BY
    # --    FLOOR((FLOOR(UNIX_TIMESTAMP(create_date) / {day}) * {day}) + (FLOOR((UNIX_TIMESTAMP(create_date) % {day})/{groupSeconds}) * {groupSeconds}))
    #     --FLOOR((FLOOR(UNIX_TIMESTAMP(create_date) / {day}) * {day}) + FLOOR((UNIX_TIMESTAMP(create_date) % {day})/{groupSeconds}))

    sql = """
    SELECT
        UNIX_TIMESTAMP(create_date),
        TRUNCATE(AVG(rt_input_v), {decimals}),
        TRUNCATE(AVG(rt_input_a), {decimals}),
        TRUNCATE(AVG(rt_input_w), {decimals}),
        TRUNCATE(AVG(rt_battery_v), {decimals}),
        TRUNCATE(AVG(rt_battery_a), {decimals}),
        TRUNCATE(AVG(rt_battery_w), {decimals}),
        TRUNCATE(AVG(rt_battery_soc) * 100, {decimals}),
        TRUNCATE((AVG(rt_battery_temp) * (9/5)) + 32, {decimals}),
        TRUNCATE((AVG(rt_remote_battery_temp) * (9/5)) + 32, {decimals}),
        TRUNCATE((AVG(rt_power_component_temp) * (9/5)) + 32, {decimals}),
        TRUNCATE((AVG(rt_case_temp) * (9/5)) + 32, {decimals}),
        TRUNCATE(AVG(rt_load_v), {decimals}),
        TRUNCATE(AVG(rt_load_a), {decimals}),
        TRUNCATE(AVG(rt_load_w), {decimals})
    FROM
        controller_real_time_data
    WHERE
        create_date between DATE_SUB(now(), INTERVAL {duration} MINUTE) and now()
    GROUP BY
        DATE(create_date),
        HOUR(create_date),
        MINUTE(create_date) DIV 2
    ORDER BY create_date;
    """
    #parameters["time"] = "DATE_FORMAT(FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(create_date) % {day})/{seconds}) * {seconds}), '%H:%i:%s')".format(**parameters)

    #result["sql"] = sql.format(**parms)
    c.execute(sql.format(**parms))
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
        "rt_remote_battery_temp",
        "rt_power_component_temp",
        "rt_case_temp",
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
