#!/usr/bin/python
import cgi
import json
import pymysql
import datetime

def json_serial(obj):
    return str(obj)

def done():
    print("Content-Type: text/html")
    print("Content-Type: application/json")
    print()
    print(json.dumps(result, default=json_serial, sort_keys = True, indent = 2))
    exit()

parameters = {
    "decimals": 2
}
result = {
  "parameters": parameters
}
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

    with open("../sql/years-with-stats.sql", mode="r", encoding="utf-8") as f:
        sql = f.read();
    c.execute(sql.format(**parameters))
    years = [];
    for row in c:
        years.append(row[0])
    result["years"] = years;
    result["fields"] = [
        "month",
        *years
    ]

    def defaultRow(monthIndex):
        row = [None] * (len(years) + 1);
        row[0] = datetime.date(years[0], monthIndex + 1, 1) #monthIndex + 1
        return row;
    data = list(map(defaultRow, range(12)));

    with open("../sql/kwh-month.sql", mode="r", encoding="utf-8") as f:
        sql = f.read();
    c.execute(sql.format(**parameters))

    for row in c:
        month = row[0];
        year = row[1];
        value = row[2];
        rowIndex = month - 1;
        columnIndex = years.index(year) + 1;
        data[rowIndex][columnIndex] = value;

    result["data"] = data;

    c.close()
except Exception as e:
    result = {"error": str(e), "type": type(e)}
    done()
done()
