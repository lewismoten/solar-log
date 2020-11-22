#!/usr/bin/python
import cgitb
cgitb.enable()

print("Content-Type: text/html")
print()
import pymysql
conn = pymysql.connect(
	db="solar",
	user="solar-user",
	password="",
	host="localhost"
)

c = conn.cursor()
#c.execute("insert INTO numbers VALUES (1, 'One!')")
#c.execute("insert INTO numbers VALUES (2, 'Two!')")
#c.execute("insert INTO numbers VALUES (3, 'Three!')")
#conn.commit()
c.execute("select * from numbers");
print([(r[0], r[1]) for r in c.fetchall()])
