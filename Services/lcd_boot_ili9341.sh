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

sudo date --set=`ds1302_get_utc`
sudo /home/ubuntu/./fbcp-ili9341.sh
sudo /usr/bin/python3 /home/ubuntu/disp.py
