SELECT
    UNIX_TIMESTAMP(create_date),
    TRUNCATE(rt_input_v, 2),
    TRUNCATE(rt_input_a, 2),
    TRUNCATE(rt_input_w, 2),
    TRUNCATE(rt_battery_v, 2),
    TRUNCATE(rt_battery_a, 2),
    TRUNCATE(rt_battery_w, 2),
    ROUND(rt_battery_soc * 100, 0),
    TRUNCATE((rt_battery_temp * (9/5)) + 32, 1),
    TRUNCATE((rt_remote_battery_temp * (9/5)) + 32, 1),
    TRUNCATE((rt_power_component_temp * (9/5)) + 32, 1),
    TRUNCATE((rt_case_temp * (9/5)) + 32, 1),
    TRUNCATE(rt_load_v, 2),
    TRUNCATE(rt_load_a, 2),
    TRUNCATE(rt_load_w, 2)
FROM
    controller_real_time_data
WHERE
    unit = 1
    AND create_date >= DATE_SUB(now(), INTERVAL 1 DAY)
;
