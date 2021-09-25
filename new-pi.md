# Setup

Steps to setup a new Raspberry Pi image.

## Keyboard Layout

Change keyboard to United States. Keyboad is default to UK and will end up typing the wrong characters - specifically non alpha-numeric characters are mixed up.

```bash
sudo raspi-config
```

1. Choose `5. Localisation Options - Configure language and regional settings`
1. Choose `L3 Keyboard - Set keyboard layout to match your keyboard`
1. Select your keyboard `Generic 101-key PC`
1. Select configuration `Other`
1. Select origin `English (US)`
1. Select configuration `English (US)`
1. Set AltGr as `The default for the keyboard layout`
1. Set Compose key as `No compose key`
1. Exit
1. Type all the symbols on the terminal to confirm they work.
`!@#$%&:;?_,.+=*"'``^/->)}]|[{(<~\`

## Wi-Fi

```bash
sudo raspi-config
```

1. Choose `1. System Options - Configure system settings`
1. Choose `S1 Wireless LAN - Enter SSID and passphrase`
1. Select your country `US - United States`
1. Enter your SSD
1. Enter your password
1. Exit and Reboot

## Hostname

```
sudo raspi-config
```

1. Choose `1. System Options - Configure system settings`
1. Choose `S4 Hostname - Set name for this computer on a network`
1. Enter the name you would like to see i.e. **solarpi**
1. Exit and Reboot


## Update OS

```bash
sudo apt update
sudo apt upgrade
sudo apt update
```

## Web Server

Install Apache

```bash
sudo apt install apache2 -y
sudo apt install apache2-dev # needed for mod-wsgi use of apxs command
sudo a2enmod cgid
#xxxsudo apt-get install libapache2-mod-python
```


mod-wsga is newer python for apache2 ?

On another computer on your network, type in the hostname you had previously set. If it doesn't work, go back to the raspberry pi and run `hostname -I` to get the IP address. Go to another computer and type in the IP in a web browser to confirm apache is up and running.

## Python

```bash
# Install pip
sudo apt install python3-pip
sudo apt install python-pip
#sudo pip3 install mod-wsgi
```

## Paython via Apache

```bash
# edit apache configuration
sudo vi /etc/apache2/apache2.conf
```

Append

```
<Directory /var/www/html/>
  Options +ExecCGI
  DirectoryIndex index.py
</Directory>
AddHandler cgi-script .py
```

```bash
# restart apache
sudo systemctl restart apache2
```


### Execute Python

```bash
cd /var/www/html
# create test file
sudo touch test.py
# mark file as executable
sudo chmod +x test.py
# edit file
sudo vi test.py
```

```python
#!/usr/bin/python
print("Content-type: text/html\n\nHello World")
```

1. Press `i` for insert mode
1. Type the sample python file above
1. Press `[Esc]` to enter command mode
1. Type `:wq` to write the file and quit
1. Type `python test.py`
1. Confirm `Content-type:text/html Hello World` is printed
1. Type `python3 test.py`
1. Confirm the same thing is printed again
1. Type `sudo chmod +x text.py` to make the file executable
1. On another computer, go to the file https://solarpi/test.py
1. Confirm the file only displays `Hello World`.


## Database
Install MariaDB _aka MySQL™_

```bash
sudo apt install mariadb-server
sudo mysql_secure_installation
```

## PyModbus

```bash
pip3 install -U pymodbus
```
Add /home/pi/.local/bin to PATH.

## Find USB serial device
ttyUSB0

`lsusb` Bus 001 Device 003: ID 1a86:7523 QinHeng Electronics HL-340 USB-Serial adpater

`dmesg | grep ttyUSB`
usb 1-1.1 ch341-uart converter now attached to ttyUSB0
usb 1-1.3 ch341-uart converter now attached to ttyUSB1

## Talk to sensor
cd 
