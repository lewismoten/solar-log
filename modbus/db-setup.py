#!/usr/bin/python
import json
import pymysql

with open("db-config.json", "r") as f:
    db = json.load(f)

conn = pymysql.connect(
	db=db["db"],
	user=db["user"],
	password=db["password"],
	host=db["host"]
)

c = conn.cursor()
c.execute("""
CREATE TABLE IF NOT EXISTS log (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (create_date),
    PRIMARY KEY(id)
);
""")

c.execute("""
CREATE TABLE IF NOT EXISTS data (
    log_id INT UNSIGNED NOT NULL,
    id SMALLINT UNSIGNED NOT NULL,
    value SMALLINT UNSIGNED NULL,
    PRIMARY KEY(log_id, id),
    INDEX (id),
    FOREIGN KEY (log_id)
        REFERENCES log(id)
        ON DELETE CASCADE
);
""")

c.execute("""
CREATE TABLE IF NOT EXISTS info (
    log_id INT UNSIGNED NOT NULL,
    id TINYINT UNSIGNED NOT NULL,
    value VARCHAR(255) NULL,
    PRIMARY KEY(log_id, id),
    INDEX (id),
    FOREIGN KEY (log_id)
        REFERENCES log(id)
        ON DELETE CASCADE
);
""")

conn.commit()
c.close()
