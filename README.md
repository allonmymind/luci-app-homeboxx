
# luci-app-homebox

LuCI management page for the Homebox LAN speed test service on OpenWrt/ImmortalWrt.

## Features

- LuCI menu entry under Services
- Open the Homebox web speed test page
- Manage the service through procd
- Depends on the `homebox` backend package

## Backend

The backend must provide `/usr/bin/homebox` and listen on port 3300.

## Service commands

```sh
/etc/init.d/homebox enable
/etc/init.d/homebox start
/etc/init.d/homebox status
```

Open the web page at:

`http://ROUTER-LAN-IP:3300/`
