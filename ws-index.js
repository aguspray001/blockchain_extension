const { WebSocket } = require("ws");
const { Kafka, logLevel } = require("kafkajs");
const { createHistory } = require("./src/controller/homeAssistant");
const { performance } = require("perf_hooks");
require("dotenv").config();

const topic = "blockchain-connector";
const kafka = new Kafka({
  clientId: "my-broker",
  brokers: [`${process.env.KAFKA_URI}:${process.env.KAFKA_PORT}`],
  logLevel: logLevel.NOTHING,
});
let isProcessing = false;

const produceToKafka = async (data) => {
  // kafka producer send to kafka broker
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic: topic,
    messages: [{ value: JSON.stringify(data) }],
  });
  await producer.disconnect();
};
const data = [];
const consumeToKafka = async () => {
  const consumer = kafka.consumer({ groupId: "blockchain-connector" });
  await consumer.connect();
  await consumer.subscribe({ topics: [topic], fromBeginning: false });
  // let response = null
  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      try {
        // console.log(message)
        const value = message.value.toString();
        // console.log(`Received message on topic ${topic}, partition ${partition}: ${value}`);
        var startTime = performance.now();
        await consumer.pause([{ topic }])    
        const history = await createHistory(privateKey, value);
        data.push(history)
        // console.log(`percobaan ke-${data.length}`)
        await consumer.resume([{ topic }])
        await consumer.commitOffsets([{ topic, partition, offset: message.offset }])
        // console.log("consume to sc => ",history)
        var endTime = performance.now();
        console.log(`${data.length} | ${endTime - startTime}`);
        return value;
        // Perform your custom logic with the received value
      } catch (error) {
        console.error('Error processing message:', error);
      }
    },
  });
  // await consumer.disconnect();
  // return response;
};

const normalProduce = async (privateKey, data) => {
  if(!isProcessing){
    isProcessing = true;
    var startTime = performance.now();
    const history = await createHistory(privateKey, data);
    var endTime = performance.now();
    console.log(`${data.length} | ${endTime - startTime}`);
    isProcessing = false;
  }
}

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

    // normal testing
    // normalProduce(privateKey, response);

    // produce data to kafka
    // console.log("tes!!!")
    await produceToKafka(response);
    console.log(response);
    // get data from kafka
    await consumeToKafka();
  }
});
