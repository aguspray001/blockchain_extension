const amqplib = require("amqplib");
// 
const { WebSocket } = require("ws");
const { createHistory } = require("./src/controller/homeAssistant");
const { performance } = require("perf_hooks");
require("dotenv").config();

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

// rabbitmq config
const queueTopic = "iot-data";

const rabbitConnect = async () => {
  conn = await amqplib.connect("amqp://10.0.2.15:5672");
  return conn;
}

const rabbitSend = async (conn, topic, data) => {
  // producer
  const buffData = Buffer.from(JSON.stringify(data));
  const ch = await conn.createChannel();
  ch.sendToQueue(topic, buffData);
};

const rabbitConsume = async (conn, topic, privateKey) => {
    // consumer
    const ch = await conn.createChannel();
    await ch.assertQueue(topic);
    ch.consume(topic, async (msg) => {
      if (msg !== null) {
        let respData = msg.content.toString();
        // console.log("rabbit consume => ", respData);
        ch.ack(msg);
  
        var startTime = performance.now();
        const history = await createHistory(privateKey, respData);
        // console.log("consume to sc => ",history)
        var endTime = performance.now();
        console.log(`${endTime - startTime}`);
      } else {
        console.log("consumer cancelled by server");
      }
    });
}

socket.addEventListener("open", () => {
  // send a message to the server
  socket.send(JSON.stringify(authRequest));
  //   socket.send(JSON.stringify(subsTrigger));
  socket.send(JSON.stringify(subsEvent));
});

// receive a message from the server
socket.addEventListener("message", async ({ data }) => {
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

    // produce data to kafka
    const connRabbit = await rabbitConnect();
    await rabbitSend(connRabbit, queueTopic, response);
    // console.log(response);
    // get data from kafka
    await rabbitConsume(connRabbit, queueTopic, privateKey);
  }
});
