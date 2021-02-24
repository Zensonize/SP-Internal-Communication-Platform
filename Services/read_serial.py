#!/usr/bin/env python
# -*- coding: utf-8 -*-
import time
import serial

ser = serial.Serial(
    port='/dev/ttyUSB0',
    baudrate=115200,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    bytesize=serial.EIGHTBITS,
    timeout=1
)
counter = 0


while 1:
    x = ser.readline()
    print (str(x,"utf-8"))
