const { WebSocket } = require("ws");
const mqtt = require("mqtt");
const { performance } = require("perf_hooks");
const { createHistory } = require("./src/controller/homeAssistant");
require("dotenv").config();

const topic = "/mqtt/bc";
const url = "ws://10.0.2.15:8885";
const clientId = "mqtt-client";

const client = mqtt.connect(url);
// client.setMaxListeners(15);

const port = process.env.WEBSOCKET_PORT;
const uri = process.env.WEBSOCKET_URI;
const socketUri = `ws://${uri}:${port}/api/websocket`;
const socket = new WebSocket(socketUri);

const filterEntity = ["light", "switch", "binary"];

const authRequest = {
  type: "auth",
  access_token: process.env.JWT_USER,
};

const subsEvent = {
  id: 1,
  type: "subscribe_events",
  event_type: "state_changed",
};

const dataMessages = new Set();
const arrayMessages = [];

function calculateJsonSize(obj) {
  const jsonString = JSON.stringify(obj);
  const sizeInBytes = new Blob([jsonString]).size;
  return sizeInBytes;
}

socket.addEventListener("open", () => {
  // send a message to the server
  socket.send(JSON.stringify(authRequest));
  //   socket.send(JSON.stringify(subsTrigger));
  socket.send(JSON.stringify(subsEvent));
});

// receive a message from the server
let isProcessing = false;
const queueDatas = [];
const setDatas = new Set();
socket.addEventListener("message", async ({ data }) => {
  // console.log(data)

  const packet = JSON.parse(data);
  const state = {
    newState: null,
    oldState: null,
  };
  // console.log(packet);
  const entityID = packet?.event?.data?.entity_id;
  if (
    packet !== null &&
    entityID !== undefined &&
    (entityID.includes(filterEntity[0]) ||
      entityID.includes(filterEntity[1]) ||
      entityID.includes(filterEntity[2]))
  ) {
    state.newState = packet?.event?.data?.new_state;
    state.oldState = packet?.event?.data?.old_state;

    const response = {
      data: state,
      entity_id: packet?.event?.data?.entity_id,
      user_id: state.newState.context.user_id,
      lastState: state.newState.state,
    };

    privateKey = "0x" + process.env.PRIVATE_KEY;
    // connect to MQTT broker
    // client.on("connect", () => {console.log("Connected to MQTT broker")});
    // produce data to mqtt broker
    client.publish(topic, JSON.stringify(response), { qos: 2 }, (err) => {
      if(err === null){
      // Subscribe to a topic with QoS 1
      client.subscribe(topic, { qos: 2 }, (err) => {});
      // Callbacks for MQTT events
    }
    });
  }
});

client.on("message", async (topic, message, packet) => {
  // console.log(topic, packet.messageId)
  const msgString = message.toString();
  // console.log(msgString)
  // queueDatas.push(msgString);

  // fix program:
  // console.log(queueDatas, queueDatas.length)
  const data = JSON.parse(msgString)
  // console.log(data.data.newState.state)
  console.log(data.data)

  let payloadSize = calculateJsonSize(JSON.parse(msgString))
  if (!isProcessing) {
    var startTime = performance.now();
    isProcessing = true;
    const history = await createHistory(privateKey, msgString);
    isProcessing = false;
    var endTime = performance.now();
    console.log(`${payloadSize} byte | ${ endTime - startTime}`);
  }
});
