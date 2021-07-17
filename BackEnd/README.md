# All of command for WSL2 and Docker

- Run Terminal with Admin Privilege 

```bash
CTRL+SHIFT+Windows Logo + Numpad
```

- To stop the WSL2 service
    
```bash
Restart-Service LxssManager # Run on Powershell with Admin privilege 
Stop-Service LxssManager # Prevent Memory Hog
```

- To start & stop the docker image 

```bash
docker-compose start <service-name>
docker-compose stop <service-name>
```

## Datagrip

No content

## Node , NPM

run app from build
- serve -d dist

run server
- npm run dev

run client
- npm run serve

run docker compose
- cd client/
- docker-compose start

run app 
- npm run dev

build app
- npm run build

# Create Service

2 files with bash script and service file with using systemd

```service
put this file to /etc/systemd/system
[Unit]
Description=Mongo Chat DB
After=multi-user.target

[Service]
Type=idle
ExecStart=/home/ubuntu/vue.chat/db/mongo_db.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target


```bash
#!/bin/bash
docker-compose start
```

### with rc
sudo update-rc.d