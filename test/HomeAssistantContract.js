// const assert = require("assert");
// const { describe } = require("mocha");
// const { createHistory } = require("../src/controller/homeAssistant");
// require("dotenv").config();
// const { performance } = require('perf_hooks');

// const respExample = {
//   data: {
//     newState: {
//       entity_id: "binary_sensor.wfttbranch02_power_status",
//       state: "unavailable",
//       attributes: [Object],
//       last_changed: "2023-05-04T14:20:03.976872+00:00",
//       last_updated: "2023-05-04T14:20:03.976872+00:00",
//       context: [Object],
//     },
//     oldState: {
//       entity_id: "binary_sensor.wfttbranch02_power_status",
//       state: "on",
//       attributes: [Object],
//       last_changed: "2023-05-04T14:19:02.840820+00:00",
//       last_updated: "2023-05-04T14:19:02.840820+00:00",
//       context: [Object],
//     },
//   },
//   entity_id: "binary_sensor.wfttbranch02_power_status",
//   user_id: null,
//   lastState: "unavailable",
// };

// describe("Testing createHistory", () => {
// //   it("should return response true", async () => {
// //     const privateKey = "0x" + process.env.PRIVATE_KEY;
// //     const resp = await createHistory(privateKey, respExample);
// //     assert.equal(resp.status,true)
// //   });

//   it("should return array of blockspeed with 20 length data", async () => {
//     const privateKey = "0x" + process.env.PRIVATE_KEY;
//     const arrayOfTime = [];
//     const loopTimes = 50;

//     let totalTime = 0;
//     for(let i=0; i<loopTimes; i++){
//         var startTime = performance.now()
//         const resp = await createHistory(privateKey, respExample);
//         // console.log(resp)
//         var endTime = performance.now()
//         console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)
//         arrayOfTime.push(endTime - startTime)
//         totalTime = totalTime + (endTime - startTime)
//     }
//     console.log(`average block speed =  ${totalTime/arrayOfTime.length} ms`)
//     assert.equal(arrayOfTime.length,loopTimes)
//   });
// });
