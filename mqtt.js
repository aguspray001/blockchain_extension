const mqtt = require('mqtt');
const { createHistory } = require("./src/controller/homeAssistant");
const { performance } = require("perf_hooks");
// MQTT broker details
const brokerUrl = 'ws://103.106.72.182:8885';
const clientId = 'mqtt-client';

// Create MQTT client with WebSocket transport
const options = {
  clientId,
  transport: 'websocket',
};

const client = mqtt.connect(brokerUrl, options);

// Callbacks for MQTT events
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to a topic with QoS 1
  client.subscribe('topic1', { qos: 1 }, (err) => {
    if (err) {
      console.error('Error subscribing to topic:', err);
    } else {
      console.log('Subscribed to topic1');
    }
  });
});

client.on('message', async (topic, message) => {
  // console.log('Received message on topic:', topic);
  // console.log('Message:', message.toString());
  privateKey = "0x" + process.env.PRIVATE_KEY;
  var startTime = performance.now();
  const history = await createHistory(privateKey, message.toString());
  // console.log(history)
  var endTime = performance.now();
  console.log(`${endTime - startTime}`);
  client.unsubscribe(topic);
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
});

