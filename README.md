# solar-log

This is a small project to monitor a solar charge controller. The original goal was to parse CSV files exported from EPEVER eLOG01 Record Accessory Adapter for EPEVER Tracer Series eTracer Series MPPT Solar Charge Controller. The process was manual, limited, and often resulted in having corrupt data. The project now uses python scripts and the modbus open architecture.

1. Via crontab, run a python script
  1. Read data from the Solar Charge Controller via modbus open architecture
  1. Save the data into a database
  1. Read the data every 10 seconds
1. Open the website hosted on the raspberry pi
  1. Load data from the database via JSON
  1. Request new data every 10 seconds


Try it out! https://lewismoten.github.io/solar-log/

![](screenshot.png)
