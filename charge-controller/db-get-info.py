#!/usr/bin/python
import json
import pymysql
from common import *

# Save our data into the database

with open("db-config.json", "r") as f:
    db = json.load(f)

conn = pymysql.connect(
	db=db["db"],
	user=db["user"],
	password=db["password"],
	host=db["host"]
)

c = conn.cursor()
# get the info.id, and log dates for the latest log
c.execute("""
    SELECT info.id, info.value
    FROM info
    INNER JOIN (
        SELECT info.id, max(log.id) AS log_id
        FROM log INNER JOIN info ON log.id = info.log_id
        GROUP BY info.id
    ) a ON info.id = a.id AND info.log_id = a.log_id
""");

info = {}
data = {}
for r in c.fetchall():
    info[r[0]] = r[1];

c.execute("""
    SELECT data.id, data.value
    FROM data
    INNER JOIN (
        SELECT data.id, max(log.id) AS log_id
        FROM log INNER JOIN data ON log.id = data.log_id
        GROUP BY data.id
    ) a ON data.id = a.id AND data.log_id = a.log_id
""");
for r in c.fetchall():
    data[r[0]] = r[1];

api = {
    "info": info,
    "data": data
}

conn.commit()
c.close()

print("Content-Type: application/json")
print()
print(json.dumps(api, sort_keys = True, indent = 2))
