# Read data from EPsolar Charge Controller

These python scripts read information from the solar charge controller using the modbus protocol.

## Installation
1. Install Modbus client `sudo pip3 install -U pymodbus`
1. Let web browser access USB on server `777 /dev/ttyUSB0` (security risk)

## Reading controller via MOD Bus
The first thing to do before setting up a cron job, or troubleshooting is to request information from the controller to verify that it can be accessed.

```bash
python print_all.py
```
This will read all of the data and print it out on the terminal. You can also print individual data:

| type | file | description |
| --- | --- | --- |
| coils | print_coils.py | Read/Write Boolean values |
| discrete input | print_discrete_input.py | Read-only Boolean values |
| input registers | print_input_registers.py | Read-only word values |
| holding registers | print_holding_registers.py | Read/Write word values |
| device | print_device.py | print device information such as name, company, serial number |
| everything | print_all.py | print all available data |

## Synchronizing the controllers clock
Statistics reset at 12:00 am. It's important that the on-board clock reflects the time accurately. If the controller loses power, its clock will reset to February 14, 2017 12:00 am when it is powered up.

`python synchronize-clock.py`

## Read data and log into database
1. charge-controller.json - data available from the charge controller and where/how to store in database
1. db-config.json - configuration
1. ?? ?? db-get-latest.py - get the most recent data
1. db-log-all.py - log everything into the database - device info, statistics, ratings, etc.
1. db-log-real-time-data.py - log the real time data / status's
1. db-setup.py - create db tables


## Setup Crontab

1. Run `crontab -e`
1. Add the following, but fix the full path to the python scripts
```
  # See https://crontab.guru for more help
  # Get real-time data once a minute
  * * * * * cd /var/www/html/modbus && /usr/bin/python /var/www/html/modbus/db-log-real-time-data.py
  # Get all data at 12:00 am
  0 0 * * * cd /var/www/html/modbus && /usr/bin/python  /var/www/html/modbus/db-log-all.py
  # Synch real-time clock at 12:01 am & 2:01 am
  # Done twice to sync after Daylight Saving Time switch
  # NOTE: Statistics reset at 00:00 am
  # NOTE: Without power, charge controller resets time to February 14, 2017 12:00 am
  1 0,2 * * * cd /var/www/html/modbus && /usr/bin/python  /var/www/html/modbus/modbus-sync-clock.py
```
1. Verify the script is running `sudo service cron status`
