# Read data from EPsolar Charge Controller

These python scripts read information from the solar charge controller using the modbus protocol.

## Installation
1. Install Modbus client `sudo pip3 install -U pymodbus`
1. Let web browser access USB on server `777 /dev/ttyUSB0`

## Reading controller via MOD Bus
The first thing to do before setting up a cron job, or troubleshooting is to request information from the controller.

```bash
python print_all.py
```
This will read all of the data and print it out on the terminal. You can also print individual data:

| type | file | description |
| --- | --- | --- |
| coils | print_coils.py | Read/Write Boolean values |
| discrete input | print_discrete_input.py | Read-only Boolean values |
| input registers | print_input_registers.py | Read-only word values |
| device | print_device.py | ?? |
| settings | print_settings.py | ?? |

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

An example of the results:
```YAML
Company: EPsolar Tech co., Ltd
Product: Tracer4210A
Version: V01.13+V02.11
Serial Number: 1620130108000001
Charging equipment rated input voltage: 100.0 Volts
Charging equipment rated input current: 40.0 Amps
Charging equipment rated input power: 1040.0 Watts
Charging equipment rated output voltage: 24.0 Volts
Charging equipment rated output current: 40.0 Amps
Charging equipment rated output power: 1040.0 Watts
Charging Mode: MPPT
Rated output current of load: 40.0 Amps
Charging equipment input voltage: 0.03 Volts
Charging equipment input current: 0.0 Amps
Charging equipment input power: 0.0 Watts
Charging equipment output voltage: 12.55 Volts
Charging equipment output current: 0.0 Amps
Charging equipment output power: 0.0 Watts
Discharging equipment output voltage: 12.55 Volts
Discharging equipment output current: 0.07 Amps
Discharging equipment output power: 0.87 Watts
Battery Temperature: 62.924°F
Temperature inside equipment: 60.26°F
Power components temperature: 60.26°F
Battery SOC: 52.0%
Remote battery temperature: 62.906000000000006°F
Battery's real rated power: 12.0 Volts
Battery Status of Voltage: Normal
Battery Status of Temperature:  Normal
Battery Status of Internal Resistance: Normal
Battery Status of Identification for rated voltage: Correct
Charging Equipment Status of Input voltage: Normal
Charging Equipment Status of MOSFET is short: No
Charging Equipment Status of Charging or Anti-reverse MOSFET is short: No
Charging Equipment Status of Anti-reverse MOSFET is short.: No
Charging Equipment Status of Input is over current.: No
Charging Equipment Status of The load is over current.: No
Charging Equipment Status of The load is short.: No
Charging Equipment Status of Load MOSFET is short.: No
Charging Equipment Status of PV Input is short.: No
Charging Equipment Status of Battery: Not charging
Charging Equipment Status of Fault: Normal
Charging Equipment Status of Running: Running
Discharging Equipment Status of Input Voltage: Normal
Discharging Equipment Status of Output Power: Light Load
Discharging Equipment Status of Short Circuit: No
Discharging Equipment Status of Unable to discharge: No
Discharging Equipment Status of Unable to stop discharging: No
Discharging Equipment Status of Output Voltage Abnormal: No
Discharging Equipment Status of Input overpressure: No
Discharging Equipment Status of High voltage side short circuit: No
Discharging Equipment Status of Boost Overpressure: No
Discharging Equipment Status of Output Overpressure: No
Discharging Equipment Status of Fault: Normal
Discharging Equipment Status of Running: Running
Maximum input volt (PV) today: 10.64 Volts
Minimum input volt (PV) today: 0.0 Volts
Maximum battery volt today: 12.66 Volts
Minimum battery volt today: 12.53 Volts
Consumed energy today: 0.0 Kilowatt Hours
Consumed energy this month: 0.01 Kilowatt Hours
Consumed energy this year: 0.02 Kilowatt Hours
Total consumed energy: 0.02 Kilowatt Hours
Generated energy today: 0.0 Kilowatt Hours
Generated energy this month: 0.52 Kilowatt Hours
Generated energy this year: 2.68 Kilowatt Hours
Total generated energy: 3.95 Kilowatt Hours
Carbon dioxide reduction: 0.0 Tons
Battery Voltage: 12.55 Volts
Battery Current: -0.08 Amps
Battery Temp.: 62.906000000000006°F
Ambient Temp.: 62.906000000000006°F
Battery Type: Sealed
Battery Capacity: 35 Amp Hours
Temperature compensation coefficient: 3.0 mV/°C/2V
High Volt. disconnect: 16.0 Volts
Charging limit voltage: 15.0 Volts
Over voltage reconnect: 15.0 Volts
Equalization voltage: 14.6 Volts
Boost voltage: 14.4 Volts
Float voltage: 13.8 Volts
Boost reconnect voltage: 13.2 Volts
Low voltage reconnect: 12.6 Volts
Under voltage recover: 12.2 Volts
Under voltage warning: 12.0 Volts
Low voltage disconnect: 11.1 Volts
Discharging limit voltage: 10.6 Volts
Real time clock: 2017-02-23 05:23:14
Equalization charging cycle: 30 Days
Battery temperature warning upper limit: 149.0°F
Battery temperature warning lower limit: -40.0°F
Controller inner temperature upper limit: 185.0°F
Controller inner temperature upper limit recover: 167.0°F
Power component temperature upper limit: 185.0°F
Power component temperature upper limit recover: 167.0°F
Line Impedance: 0.0 milliohms
Night Time Threshold Volt.(NTTV): 5.0 Volts
Light signal startup (night) delay time: 10 Minutes
Day Time Threshold Volt.(DTTV): 6.0 Volts
Light signal turn off(day) delay time: 10 Minutes
Load controlling modes: Manual Control
Working time length 1: 1 hours 0 minutes
Working time length 2: 1 hours 0 minutes
Turn on timing 1: 19:00:00
Turn off timing 1: 06:00:00
Turn on timing 2: 19:00:00
Turn off timing 2: 06:00:00
Backlight time: 60 Seconds
Length of night: 12 hours 53 minutes
Battery rated voltage code: Auto Recognize
Load timing control selection: Using timer 1
Default Load On/Off in manual mode: On
Equalize Duration: 120 Minutes
Boost Duration: 120 Minutes
Discharge Percentage: 80.0%
Charging Percentage: 100.0%
Management modes for battery charging and discharging: Voltage compensation
Manual control the load: Off
Default control the load: Off
Enable load test mode: disabled
Force the load: Turn off (used for temporary test of the load)
Over temperature inside device: Normal
Day/Night: Day
```
dmesg | grep tty | grep USB '{print $1}'
sudo dpkg-reconfigure tzdata
udevadm
/usr/bin/python
/usr/bin/python3
ps -ef | grep crond
timedatectl
sudo service apache2 restart
sudo nano /etc/apache2/sites-enabled/000-default.conf
sudo chmod 777 modbus.py
sudo nano /var/log/apache2/error.log
which python
sudo dos2unix modbus.py
chmod u+x modbus.py
/var/log
sudo pip3 install -U pymodbus
sudo chmod -R 777 /var/www/html
sudo usermod -a -G www-data $USER
sudo nano /etc/ssh/sshd_config
pip3 search sftp
pip3 search ftp
mysql -u root@localhost -p
mysql -u root -p
sudo mysql_secure_installation
sudo a2dismod mpm_event
sudo apt-get install apache2
sudo pip3 install pymysql
sudo apt-get install mysql-server
python --version
sudo apt-get install python3-pip
sudo ln -s /usr/bin/python3 /usr/bin/python
sudo apt-get dist-upgrade
sudo apt-get update
sudo raspi-config
sudo find / -name hosts
hostname
ifconfig
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
sudo nano /etc/network/interfaces
lsusb
wifi
sudo vi /etc/default/keyboard
uptime


[Sun Nov 22 20:33:01.382499 2020] [cgi:error] [pid 19988] [client 192.168.54.37:57831] AH01215: ERROR:pymodbus.client.sync:[Errno 13] could not open port /dev/ttyUSB0: [Errno 13] Permission denied: '/dev/ttyUSB0': /var/www/html/modbus/print_coils.py, referer: http://solarpi/modbus/index.html

need to allow "anonymouse??" to access /dev/ttyUSB0
ls -l /dev/ttyUSB0
gives me ... crw-rw---- 1 root dialout 188, 0 Nov 22 20:40 /dev/ttyUSB0
tail -f /var/log/apache2/error.log 