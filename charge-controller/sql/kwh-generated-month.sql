SELECT
      MONTH(create_date),
      YEAR(create_date),
      TRUNCATE(MAX(stat_generated_kwh_month), {decimals})
  FROM
      controller_statistics
  GROUP BY
      YEAR(create_date),
      MONTH(create_date)
  ORDER BY
      create_date ASC
