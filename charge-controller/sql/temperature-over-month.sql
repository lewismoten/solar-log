SELECT
    DATE_FORMAT(MIN(create_date), "%Y-%m-%d %H:00:00") AS `create_date`,
    TRUNCATE((AVG(rt_case_temp) * (9/5)) + 32, 1) AS `rt_case_temp`
FROM
    controller_real_time_data
WHERE
    create_date >= DATE_SUB(now(), INTERVAL 1 YEAR)
GROUP BY
    YEAR(create_date),
    MONTH(create_date),
    DAY(create_date),
    HOUR(create_date)
;
