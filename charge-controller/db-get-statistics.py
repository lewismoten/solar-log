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

try:
  start = datetime.strptime(form.getvalue("start") + " 00:00:00", "%Y-%m-%d %H:%M:%S")
except Exception as e:
  result["error"] = e
  done()

try:
  end = datetime.strptime(form.getvalue("end") + " 23:59:59", "%Y-%m-%d %H:%M:%S")
except Exception as e:
  result["error"] = e
  done()

try:
  count = int(form.getvalue("count", 50))
  if count > 1000:
    count = 1000
  if count < 1:
    count = 1
except Exception as e:
  result["error"] = e
  done()

totalSeconds = (end - start).total_seconds() + 1

if totalSeconds < 1:
    result["error"] = "invalid date range"
    done()

secondsInADay = 24 * 60 * 60
if totalSeconds > secondsInADay:
    totalSeconds = secondsInADay
parameters = {
    "start": start,
    "end": end,
    "seconds": int(totalSeconds / count),
    "count": count,
    "decimals": 2,
    "day": secondsInADay
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

    parameters["time"] = "DATE_FORMAT(FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(create_date) % {day})/{seconds}) * {seconds}), '%H:%i')".format(**parameters)

    sql = """
    SELECT
        DATE_FORMAT(create_date, '%H:%i:00'),
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
        create_date BETWEEN '{start}' AND '{end}'
    GROUP BY
        HOUR(create_date),
        MINUTE(create_date) DIV 5
    ORDER BY
        HOUR(create_date),
        MINUTE(create_date) DIV 5
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


    conn.commit()
    c.close()
except Exception as e:
    result = {"error": str(e), "type": type(e)}
    done()
done()
