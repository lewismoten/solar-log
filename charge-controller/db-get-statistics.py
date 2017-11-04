#!/usr/bin/python
import cgi
import json
import pymysql
from datetime import datetime

result = {"error": "unknown"}

def json_serial(obj):
    return str(obj)

def done():
    print("Content-Type: text/html")
    print("Content-Type: application/json")
    print()
    print(json.dumps(result, default=json_serial, sort_keys = True, indent = 2))
    exit()

form = cgi.FieldStorage()

parameters = {}

now = datetime.now()
start = form.getvalue("start", now.strftime("%Y-%m-%d"))
end = form.getvalue("end", now.strftime("%Y-%m-%d"))

parameters = {
    "start": start,
    "end": end,
    "decimals": 2
}
result = {
  "parameters": parameters
}

try:
    with open("db-config.json", mode="r", encoding="utf-8") as f:
        db = json.load(f)

    conn = pymysql.connect(
    	db=db["db"],
    	user=db["user"],
    	password=db["password"],
    	host=db["host"]
    )

    c = conn.cursor()

    #parameters["time"] = "DATE_FORMAT(FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(create_date) % {day})/{seconds}) * {seconds}), '%H:%i')".format(**parameters)

    sql = """
    SELECT
        day_grouping.start,
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
        INNER JOIN day_grouping ON
            duration = 15
            and time(create_date) BETWEEN start and stop
    WHERE
        create_date BETWEEN '{start} 00:00:00' AND '{end} 23:59:59'
    GROUP BY
       day_grouping.start
    ;
    """
    c.execute(sql.format(**parameters))
    result["data"] = []
    for row in c:
        result["data"].append(row)

    result["fields"] = [
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

    c.close()
except Exception as e:
    result = {"error": str(e), "type": type(e)}
    done()
done()
