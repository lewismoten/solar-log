# Troubleshooting Notes

hello world

## EPEVER eLOG01 Record Accessory Adapter For EPEVER Tracer Series eTracer Series MPPT Solar Charge Controller

1. Header
  1. Missing column name for the date.
  1. *Array Current(A)* has a trailing space.
1. Date Format
  1. Two spaces between date/timestamp
  1. Seconds are always zero
  1. Date parts are not padded with zero
  1. Unrecognized format `YYYY/M/D  H:m:0`
    1. Expected `2017-02-14 23:57:12`
    1. Actual `2017/2/14  23:57:0`
1. Logging Interval
  1. Unable to change logging interval.
  1. Manual specifies default to be every 10 minutes.
    1. Logs appear every 11 to 12 minutes.
  1. Occasionally skips an interval recording *logs after 24 minutes instead of 12*
1. Corruption
  1. Accessory stopped logging and was flashing red. Manual reset changed to solid green light. *Last log 2017/10/7  23:49:0*
  1. Date did not roll over to the next day *2017/2/14  23:57:0 went to 2017/2/14  0:08:0*
  1. Header sometimes appears twice at the top of the file.
