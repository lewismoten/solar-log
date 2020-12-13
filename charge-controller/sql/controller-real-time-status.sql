SELECT
    UNIX_TIMESTAMP(create_date) AS `create_date`,
    rt_battery_status,
    rt_charging_equipment_status,
    rt_discharging_equipment_status
FROM
    controller_real_time_status
WHERE
    create_date >= DATE_SUB(now(), INTERVAL 1 DAY)
ORDER BY
    create_date ASC
;
