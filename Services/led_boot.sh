#!/bin/bash

### BEGIN INIT INFO
# Provides:          led_boot
# Required-Start:    networking
# Required-Stop:     networking
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Booting System 
# Description:       Booting OS
### END INIT INFO

DATE_TIME=`date "+%Y/%m/%d-%H:%M:%S"`
echo "Executed completed at : $DATE_TIME" >> /home/ubuntu/bootlog.txt

sudo echo 22 > /sys/class/gpio/export
sudo echo 23 > /sys/class/gpio/export
sudo echo 24 > /sys/class/gpio/export

sudo echo out > /sys/class/gpio/gpio22/direction
sudo echo out > /sys/class/gpio/gpio23/direction
sudo echo out > /sys/class/gpio/gpio24/direction

sudo echo 1 > /sys/class/gpio/gpio22/value
sleep 1s
sudo echo 0 > /sys/class/gpio/gpio22/value
sudo echo 1 > /sys/class/gpio/gpio23/value
sleep 1s
sudo echo 0 > /sys/class/gpio/gpio23/value
sudo echo 1 > /sys/class/gpio/gpio24/value
sleep 1s
sudo echo 0 > /sys/class/gpio/gpio24/value

sudo /usr/bin/python3 /home/ubuntu/disp.py
