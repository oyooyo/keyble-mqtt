#!/usr/bin/env node

'use strict';

// Required imports

const {ArgumentParser:Argument_Parser, ArgumentDefaultsHelpFormatter:Argument_Defaults_Help_Formatter} = require('argparse');

const {Key_Ble, utils:{canonicalize_hex_string, canonicalize_mac_address}} = require('keyble');

const {connect:connect_to_mqtt_broker} = require('mqtt');

// Default values

const DEFAULT_HOST = '127.0.0.1';

const DEFAULT_PORT = 1883;

const DEFAULT_USERNAME = undefined;

const DEFAULT_PASSWORD = undefined;

const DEFAULT_CLIENT_ID = 'keyble-{canonical_address}';

const DEFAULT_ROOT_TOPIC = 'keyble/{canonical_address}';

const DEFAULT_DEVICE_ROOT_TOPIC = '{root_topic}';

const DEFAULT_DEVICE_COMMAND_TOPIC = '{device_root_topic}/command';

const DEFAULT_DEVICE_STATUS_TOPIC = '{device_root_topic}/status';

const DEFAULT_CLIENT_ROOT_TOPIC = '{root_topic}/client';

const DEFAULT_CLIENT_STATUS_TOPIC = '{client_root_topic}/status';

const DEFAULT_ONLINE_MESSAGE = 'online';

const DEFAULT_OFFLINE_MESSAGE = 'offline';

const DEFAULT_QOS = 0;

const DEFAULT_KEEPALIVE = 60;

// Functions

const format_string = (string, values) =>
	((typeof(string) === 'string') ? string.replace(/{(?<value_id>[A-Za-z0-9 _\-]+)}/g, ((match, value_id) => values[value_id])) : string)

const connect_to_mqtt_broker_async = (options) => new Promise((resolve, reject) => {
	const mqtt_client = connect_to_mqtt_broker(options);
	mqtt_client.once('connect', (connack) => {
		resolve(mqtt_client);
	});
	mqtt_client.once('error', (error) => {
		reject(error);
	});
})

const publish_mqtt_message_async = (mqtt_client, topic, message, options) => new Promise((resolve, reject) => {
	mqtt_client.publish(topic, message, options, (error) => {
		if (error) {
			reject(error);
		} else {
			resolve();
		}
	});
})

const subscribe_to_mqtt_topics_async = (mqtt_client, topic_array, options) => new Promise((resolve, reject) => {
	mqtt_client.subscribe(topic_array, options, (error, granted) => {
		if (error) {
			reject(error);
		} else {
			resolve(granted);
		}
	});
})

const run_mqtt_client = async (address, user_id, user_key, {
	host=DEFAULT_HOST,
	port=DEFAULT_PORT,
	online_message=DEFAULT_ONLINE_MESSAGE,
	offline_message=DEFAULT_OFFLINE_MESSAGE,
	qos=DEFAULT_QOS,
	keepalive=DEFAULT_KEEPALIVE,
	username:username_pattern=DEFAULT_USERNAME,
	password:password_pattern=DEFAULT_PASSWORD,
	client_id:client_id_pattern=DEFAULT_CLIENT_ID,
	root_topic:root_topic_pattern=DEFAULT_ROOT_TOPIC,
	device_root_topic:device_root_topic_pattern=DEFAULT_LOCK_ROOT_TOPIC,
	device_command_topic:device_command_topic_pattern=DEFAULT_LOCK_COMMAND_TOPIC,
	device_status_topic:device_status_topic_pattern=DEFAULT_LOCK_STATUS_TOPIC,
	client_root_topic:client_root_topic_pattern=DEFAULT_CLIENT_ROOT_TOPIC,
	client_status_topic:client_status_topic_pattern=DEFAULT_CLIENT_STATUS_TOPIC,
}) => {
	const canonical_address = canonicalize_mac_address(address);
	const short_address = canonicalize_hex_string(canonical_address);
	const values_1 = {
		host: host,
		port: port,
		online_message: online_message,
		offline_message: offline_message,
		qos: qos,
		keepalive: keepalive,
		address: address,
		canonical_address: canonical_address,
		short_address: short_address,
	};
	const username = format_string(username_pattern, values_1);
	const password = format_string(password_pattern, values_1);
	const client_id = format_string(client_id_pattern, values_1);
	const root_topic = format_string(root_topic_pattern, values_1);
	const values_2 = {...values_1,
		username: username,
		password: password,
		client_id: client_id,
		root_topic: root_topic,
	};
	const device_root_topic = format_string(device_root_topic_pattern, values_2);
	const client_root_topic = format_string(client_root_topic_pattern, values_2);
	const values_3 = {...values_2,
		device_root_topic: device_root_topic,
		client_root_topic: client_root_topic,
	};
	const device_command_topic = format_string(device_command_topic_pattern, values_3);
	const device_status_topic = format_string(device_status_topic_pattern, values_3);
	const client_status_topic = format_string(client_status_topic_pattern, values_3);
	const mqtt_client = await connect_to_mqtt_broker_async({
		servers: [{host:host, port:port}],
		keepalive: keepalive,
		clientId: client_id,
		username: username,
		password: password,
		will: {
			topic: client_status_topic,
			payload: offline_message,
			qos: qos,
			retain: true,
		},
	});
	const keyble_device = new Key_Ble({
		address: canonical_address,
		user_id: user_id,
		user_key: user_key,
	});
	keyble_device.on('status_update', async (lock_state) => {
		await publish_mqtt_message_async(mqtt_client, device_status_topic, JSON.stringify(lock_state), {
			qos: qos,
			retain: false,
		});
	});
	mqtt_client.on('message', async (topic, message_buffer) => {
		const message = message_buffer.toString().trim();
		switch(topic) {
			case device_command_topic:
				switch(message.toLowerCase()) {
					case 'lock':
						await keyble_device.lock();
						break;
					case 'unlock':
						await keyble_device.unlock();
						break;
					case 'open':
						await keyble_device.open();
						break;
					case 'toggle':
						await keyble_device.toggle();
						break;
					default:
						// TODO handle or ignore invalid/unknown command?
						break;
				}
				break;
			default:
				// TODO handle or ignore invalid/unknown topic?
				break;
		}
	});
	subscribe_to_mqtt_topics_async(mqtt_client, [device_command_topic], {
		qos: qos,
	});
	await publish_mqtt_message_async(mqtt_client, client_status_topic, online_message, {
		qos: qos,
		retain: true,
	});
}

// Main

if (require.main == module) {
	const argument_parser = new Argument_Parser({
		description: 'MQTT client for controlling eQ-3 eqiva bluetooth smart locks',
		formatter_class: Argument_Defaults_Help_Formatter,
	});
	argument_parser.add_argument('address', {
		help: 'The smart lock\'s MAC address (a string with exactly 12 hexadecimal characters)',
		type: 'str',
	});
	argument_parser.add_argument('user_id', {
		help: 'The user ID (an integer number)',
		type: 'int',
	});
	argument_parser.add_argument('user_key', {
		help: 'The user key (a string with exactly 32 hexadecimal characters)',
		type: 'str',
	});
	argument_parser.add_argument('--host', {
		help: 'The IP address of the broker',
		type: 'str',
		default: DEFAULT_HOST,
	});
	argument_parser.add_argument('--port', {
		help: 'The port number of the broker',
		type: 'int',
		default: DEFAULT_PORT,
	});
	argument_parser.add_argument('--username', {
		help: 'The username to be used for authenticating with the broker',
		type: 'str',
		default: DEFAULT_USERNAME,
	});
	argument_parser.add_argument('--password', {
		help: 'The password to be used for authenticating with the broker',
		type: 'str',
		default: DEFAULT_PASSWORD,
	});
	argument_parser.add_argument('--client_id', {
		help: 'The client ID to be used for authenticating with the broker',
		type: 'str',
		default: DEFAULT_CLIENT_ID,
	});
	argument_parser.add_argument('--root_topic', {
		help: 'The "root" topic',
		type: 'str',
		default: DEFAULT_ROOT_TOPIC,
	});
	argument_parser.add_argument('--device_root_topic', {
		help: 'The "device root" topic',
		type: 'str',
		default: DEFAULT_DEVICE_ROOT_TOPIC,
	});
	argument_parser.add_argument('--device_command_topic', {
		help: 'The "device command" topic',
		type: 'str',
		default: DEFAULT_DEVICE_COMMAND_TOPIC,
	});
	argument_parser.add_argument('--device_status_topic', {
		help: 'The "device status" topic',
		type: 'str',
		default: DEFAULT_DEVICE_STATUS_TOPIC,
	});
	argument_parser.add_argument('--client_root_topic', {
		help: 'The "client root" topic',
		type: 'str',
		default: DEFAULT_CLIENT_ROOT_TOPIC,
	});
	argument_parser.add_argument('--client_status_topic', {
		help: 'The "client status" topic',
		type: 'str',
		default: DEFAULT_CLIENT_STATUS_TOPIC,
	});
	argument_parser.add_argument('--online_message', {
		help: 'The (retained) message that will be published to the status topic when the client is online',
		type: 'str',
		default: DEFAULT_ONLINE_MESSAGE,
	});
	argument_parser.add_argument('--offline_message', {
		help: 'The (retained) message that will be published to the status topic when the client is offline',
		type: 'str',
		default: DEFAULT_OFFLINE_MESSAGE,
	});
	argument_parser.add_argument('--qos', {
		help: 'The quality of service (QOS) level to use',
		type: 'int',
		choices: [0, 1, 2],
		default: DEFAULT_QOS,
	});
	argument_parser.add_argument('--keepalive', {
		help: 'The number of seconds between sending PING commands to the broker for the purposes of informing it we are still connected and functioning (0=disabled)',
		type: 'int',
		default: DEFAULT_KEEPALIVE,
	});
	const {address, user_id, user_key, ...options} = argument_parser.parse_args();
	run_mqtt_client(address, user_id, user_key, options)
	.catch((error) => {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	});
}
