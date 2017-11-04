#!/usr/bin/python
import cgi
import json
import pymysql
from datetime import datetime, time, timedelta, date

with open("db-config.json", mode="r", encoding="utf-8") as f:
    db = json.load(f)

conn = pymysql.connect(
	db=db["db"],
	user=db["user"],
	password=db["password"],
	host=db["host"]
)

c = conn.cursor()
sql = "DROP TABLE IF EXISTS day_grouping;"
c.execute(sql)

sql = """
CREATE TABLE day_grouping(
    duration int unsigned not null,
    start time not null,
    stop time not null,
    index(duration, start, stop),
    primary key(duration, start)
);
"""
c.execute(sql)

def generateDay(minutes):
    print("generating {}".format(minutes))
    sql = "INSERT INTO day_grouping(duration, start, stop) values (%s, %s, %s)"
    now = datetime(2000, 1, 1)
    while True:
        edge = now + timedelta(minutes=minutes, microseconds=-1)
        params = [minutes, now.time(), edge.time()]
        c.execute(sql, params)
        now = now + timedelta(minutes=minutes)
        if(now.day == 2):
            break

# factors for number of minutes in a day (1440)
for minutes in [1,2,3,4,5,6,8,9,10,12,15,16,18,20,24,30,32,36,40,45,48,60,72,80,90,96,120,144,160,180,240,288,360,480,720,1440]:
    generateDay(minutes)

sql = '''
SELECT
    start,
    TRUNCATE(AVG(rt_battery_soc), 2) * 100 AS rt_battery_soc
FROM
    controller_real_time_data
INNER JOIN day_grouping ON
    duration = 30
    AND TIME(create_date) BETWEEN start AND stop
WHERE
    create_date BETWEEN '2017-11-03 00:00:00' AND '2017-11-03 23:59:59'
GROUP BY
    start;
'''

c.close()
conn.commit();
print("done")
