# keyble-mqtt

MQTT client for controlling [eQ-3 eqiva bluetooth smart locks](https://www.eq-3.com/products/homematic/detail/bluetooth-smart-lock.html).

Uses the [keyble](https://github.com/oyooyo/keyble) library. keyble-mqtt is just one way of controlling these smart locks, see [here](https://github.com/oyooyo/keyble#projects-using-keyble) for other ways.

## Installation

### Global installation

```
$ npm install --update --global --unsafe-perm keyble-mqtt
```
If installing on a Linux system, you will probably need to run the above command with `sudo`.

## Usage

Run `keyble-mqtt --help` to get a summary of all command line arguments.

```
$ keyble-mqtt --help
usage: keyble-mqtt.js [-h] [--host HOST] [--port PORT] [--username USERNAME]
                      [--password PASSWORD] [--client_id CLIENT_ID]
                      [--root_topic ROOT_TOPIC]
                      [--device_root_topic DEVICE_ROOT_TOPIC]
                      [--device_command_topic DEVICE_COMMAND_TOPIC]
                      [--device_status_topic DEVICE_STATUS_TOPIC]
                      [--client_root_topic CLIENT_ROOT_TOPIC]
                      [--client_status_topic CLIENT_STATUS_TOPIC]
                      [--online_message ONLINE_MESSAGE]
                      [--offline_message OFFLINE_MESSAGE] [--qos {0,1,2}]
                      [--keepalive KEEPALIVE]
                      address user_id user_key

MQTT client for controlling eQ-3 eqiva bluetooth smart locks

positional arguments:
  address               The smart lock's MAC address (a string with exactly 12
                        hexadecimal characters)
  user_id               The user ID (an integer number)
  user_key              The user key (a string with exactly 32 hexadecimal
                        characters)

optional arguments:
  -h, --help            show this help message and exit
  --host HOST           The IP address of the broker (default: 127.0.0.1)
  --port PORT           The port number of the broker (default: 1883)
  --username USERNAME   The username to be used for authenticating with the
                        broker (default: undefined)
  --password PASSWORD   The password to be used for authenticating with the
                        broker (default: undefined)
  --client_id CLIENT_ID
                        The client ID to be used for authenticating with the
                        broker (default: keyble-{canonical_address})
  --root_topic ROOT_TOPIC
                        The "root" topic (default: keyble/{canonical_address})
  --device_root_topic DEVICE_ROOT_TOPIC
                        The "device root" topic (default: {root_topic})
  --device_command_topic DEVICE_COMMAND_TOPIC
                        The "device command" topic (default:
                        {device_root_topic}/command)
  --device_status_topic DEVICE_STATUS_TOPIC
                        The "device status" topic (default:
                        {device_root_topic}/status)
  --client_root_topic CLIENT_ROOT_TOPIC
                        The "client root" topic (default: {root_topic}/client)
  --client_status_topic CLIENT_STATUS_TOPIC
                        The "client status" topic (default:
                        {client_root_topic}/status)
  --online_message ONLINE_MESSAGE
                        The (retained) message that will be published to the
                        status topic when the client is online (default:
                        online)
  --offline_message OFFLINE_MESSAGE
                        The (retained) message that will be published to the
                        status topic when the client is offline (default:
                        offline)
  --qos {0,1,2}         The quality of service (QOS) level to use (default: 0)
  --keepalive KEEPALIVE
                        The number of seconds between sending PING commands to
                        the broker for the purposes of informing it we are
                        still connected and functioning (0=disabled) (default:
                        60)
```

### Usage examples

At the very least, you need to specify the three required, positional arguments:

- the smart lock's MAC address
- the user ID
- the user key
```
$ keyble-mqtt 01:23:45:67:89:ab 1 ca78ad9b96131414359e5e7cecfd7f9e
```

Unless keyble is running on the same system as your MQTT broker, you will also need to at least specify the IP address of your MQTT broker:

```
$ keyble-mqtt 01:23:45:67:89:ab 1 ca78ad9b96131414359e5e7cecfd7f9e --host 192.168.0.3 
```
