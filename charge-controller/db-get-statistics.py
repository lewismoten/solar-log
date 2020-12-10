#!/usr/bin/python
import cgi
import json
import pymysql
from datetime import datetime
#from dateutil.relativedelta import relativedelta

result = {"error": "unknown"}

def json_serial(obj):
    return str(obj)

def done():
    print("Content-Type: text/html")
    print("Content-Type: application/json")
    print()
    print(json.dumps(result, default=json_serial, sort_keys = True, indent = 2))
    exit()

# form = cgi.FieldStorage()
#
# parameters = {}
#
now = datetime.today()
# defaultStart = now + relativedelta(years=-1);
# start = form.getvalue("start", defaultStart.strftime("%Y-%m-%d"))
# end = form.getvalue("end", now.strftime("%Y-%m-%d"))

start = datetime(now.year - 1, now.month, now.day).strftime("%Y-%m-%d")
end = now.strftime("%Y-%m-%d")

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

    sql = """
    SELECT
        DATE_FORMAT(create_date, '%Y-%m-%d'),
        TRUNCATE(MIN(stat_min_input_v_today), {decimals}),
        TRUNCATE(MAX(stat_max_input_v_today), {decimals}),
        TRUNCATE(MIN(stat_min_battery_v_today), {decimals}),
        TRUNCATE(MAX(stat_max_battery_v_today), {decimals}),
        TRUNCATE(MAX(stat_consumed_kwh_today), {decimals}),
        TRUNCATE(MAX(stat_consumed_kwh_year), {decimals}),
        TRUNCATE(MAX(stat_consumed_kwh_total), {decimals}),
        TRUNCATE(MAX(stat_generated_kwh_today), {decimals}),
        TRUNCATE(MAX(stat_generated_kwh_year), {decimals}),
        TRUNCATE(MAX(stat_generated_kwh_total), {decimals})
    FROM
        controller_statistics
    WHERE
        create_date BETWEEN '{start} 00:00:00' AND '{end} 23:59:59'
    GROUP BY
        YEAR(create_date),
        MONTH(create_date),
        DAY(create_date)
    ORDER BY
        create_date ASC
    ;
    """
    c.execute(sql.format(**parameters))
    result["data"] = []
    for row in c:
        result["data"].append(row)

    result["fields"] = [
        "create_date",
        "stat_min_input_v_today",
        "stat_max_input_v_today",
        "stat_min_battery_v_today",
        "stat_max_battery_v_today",
        "stat_consumed_kwh_today",
        "stat_consumed_kwh_year",
        "stat_consumed_kwh_total",
        "stat_generated_kwh_today",
        "stat_generated_kwh_year",
        "stat_generated_kwh_total"
    ]

    c.close()
except Exception as e:
    result = {"error": str(e), "type": type(e)}
    done()
done()
