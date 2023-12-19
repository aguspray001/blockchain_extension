const express = require("express");
const Web3 = require("web3");
const bodyParser = require("body-parser");
const moment = require("moment");
require("dotenv").config();
// contract ABI
const contactsABI = require("./src/build/contracts/Contacts.json");
const homeAssistantABI = require("./src/build/contracts/HomeAssistant.json");

const app = express();
const web3 = new Web3();
web3.setProvider(
  new web3.providers.HttpProvider(
    `${process.env.PROTOCOL}://${process.env.BLOCKCHAIN_URI}:${process.env.BLOCKCHAIN_PORT}`
  )
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/test/contact", async (req, res) => {
  const { id, name, phoneNumber, privateKey } = req.body;
  //if data
  // console.log(req.body);
  if (name !== null && phoneNumber !== null) {
    //build user account from privatekey
    let account = await web3.eth.accounts.privateKeyToAccount(privateKey);
    // console.log("accout => ", account);
    //get nonce
    const nonce = await web3.eth.getTransactionCount(account.address, "latest");
    // console.log(nonce);

    //get chain id
    const chainId = await web3.eth.net.getId();
    //get network id
    const deployedNetwork = contactsABI.networks[`${chainId}`];
    // console.log(deployedNetwork);
    const contractAddress = deployedNetwork.address;
    //gas price
    const gasPrice = await web3.eth.getGasPrice();
    console.log("data config => ", {
      chainId,
      gasPrice,
      deployedNetwork,
      account,
      nonce,
    });
    //contract
    let contactContractInstance = await new web3.eth.Contract(
      contactsABI.abi,
      deployedNetwork.address
    );
    // encode ABI from smart contract
    let createContact = contactContractInstance.methods.createContact(
      web3.utils.numberToHex(id),
      web3.utils.toHex(name),
      web3.utils.toHex(phoneNumber),
      web3.utils.toHex(account.address)
    );

    // console.log("createContact => ", await createContact.estimateGas());
    const estimatedGas = await createContact.estimateGas();
    const createContactEncodedABI = await createContact.encodeABI();
    // console.log("createContactEncodedABI => ", createContactEncodedABI);
    const transaction = {
      // from: account.privateKey,
      nonce: nonce,
      chainId: chainId,
      to: contractAddress,
      data: createContactEncodedABI,
      // gasPrice:web3.utils.toHex(gasPrice),
      gas: estimatedGas,
    };

    //sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(
      transaction,
      account.privateKey
    );
    // console.log("signedTx => ", signedTx);
    //if tx signed, then send the data to the blockchain
    web3.eth.sendSignedTransaction(
      web3.utils.toHex(signedTx.rawTransaction),
      function (err, hash) {
        if (!err) {
          //send oke response
          res.status(200).send({
            status: 200,
            message: err,
            hashCode: hash,
          });
        } else {
          //send error response
          res.status(500).send({
            status: 500,
            message: `${err}`,
            hashCode: hash,
          });
        }
      }
    );
  } else {
    //send error response
    res.status(400).send({
      status: 400,
      message: "data invalid",
      hashCode: null,
    });
  }
});

app.get("/test/contact", async (req, res) => {
  const { id, privateKey } = req.body;
  //if data
  if (id !== null) {
    let account = await web3.eth.accounts.privateKeyToAccount(privateKey);
    //get chain id
    const chainId = await web3.eth.net.getId();
    //get network id
    const deployedNetwork = contactsABI.networks[`${chainId}`];
    //get contract address
    const contractAddress = deployedNetwork.address;

    //contract
    let contactContractInstance = await new web3.eth.Contract(
      contactsABI.abi,
      contractAddress
    );
    // encode ABI from smart contract
    let getContact = await contactContractInstance.methods
      .getContact(web3.utils.toHex(id))
      .call({ from: account.address });

    const response = {
      id: Number(getContact["id"]),
      name: web3.utils.hexToAscii(getContact["name"]),
      phone: web3.utils.hexToNumberString(getContact["phone"]),
    };
    res.status(200).send({
      status: 200,
      message: "successfully get data",
      data: response,
    });
  } else {
    res.status(500).send({
      status: 500,
      message: "unsuccessfully get data",
      data: response,
    });
  }
});

app.post("/ha/history", async (req, res) => {
  const { id, privateKey } = req.body;
  //if data
  if (id !== null && privateKey !== null) {
    //build user account from privatekey
    let account = await web3.eth.accounts.privateKeyToAccount(privateKey);

    //get nonce
    const nonce = await web3.eth.getTransactionCount(account.address, "latest");
    //get chain id
    const chainId = await web3.eth.net.getId();
    //get network id
    const deployedNetwork = homeAssistantABI.networks[`${chainId}`];
    const contractAddress = deployedNetwork.address;
    //gas price
    const gasPrice = await web3.eth.getGasPrice();
    //logger
    console.log("data config => ", {
      chainId,
      gasPrice,
      contractAddress,
      account,
      nonce,
    });
    //contract
    let homeAssistantContractInstance = await new web3.eth.Contract(
      homeAssistantABI.abi,
      deployedNetwork.address
    );
    console.log(Date.now);
    // encode ABI from smart contract
    let createHistory = await homeAssistantContractInstance.methods.createHistory(
      web3.utils.toHex(
        JSON.stringify({
          newState: true,
          oldState: false,
        })
      ),
      web3.utils.toHex(Date.now()),
      web3.utils.toHex(account.address) //public key
    );
    console.log(createHistory)
    // console.log("createContact => ", await createContact.estimateGas());
    const estimatedGas = await createHistory.estimateGas();
    const createHistoryEncodedABI = await createHistory.encodeABI();
    // console.log("createContactEncodedABI => ", createContactEncodedABI);
    const transaction = {
      // from: account.privateKey,
      nonce: nonce,
      chainId: chainId,
      to: contractAddress,
      data: createHistoryEncodedABI,
      gasPrice:web3.utils.toHex(0),
      gas: estimatedGas + 100000,
    };

    //sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(
      transaction,
      account.privateKey
    );
    // console.log("signedTx => ", signedTx);
    //if tx signed, then send the data to the blockchain
    web3.eth.sendSignedTransaction(
      web3.utils.toHex(signedTx.rawTransaction),
      function (err, hash) {
        if (!err) {
          //send oke response
          res.status(200).send({
            status: 200,
            message: err,
            hashCode: hash,
          });
        } else {
          //send error response
          res.status(500).send({
            status: 500,
            message: `${err}`,
            hashCode: hash,
          });
        }
      }
    );
  } else {
    //send error response
    res.status(400).send({
      status: 400,
      message: "data invalid",
      hashCode: null,
    });
  }
});

app.get("/ha/history", async (req, res) => {
  const { id, privateKey } = req.body;
  if (id !== null) {
    let account = await web3.eth.accounts.privateKeyToAccount(privateKey);
    //get chain id
    const chainId = await web3.eth.net.getId();
    //get network id
    const deployedNetwork = homeAssistantABI.networks[`${chainId}`];
    //get contract address
    const contractAddress = deployedNetwork.address;
    console.log(contractAddress)
    //contract
    let homeAssistantContractInstance = await new web3.eth.Contract(
      homeAssistantABI.abi,
      contractAddress
    );
    // encode ABI from smart contract
    let history = await homeAssistantContractInstance.methods
    .getHistory(web3.utils.toHex(id)).call({ from: account.address });
    // await homeAssistantContractInstance.events.History({},function (err, result) {
    //   if(!err){
    //     console.log(result)
    //   }
    //   console.log(err)
    // })
    console.log(history)
    
    const response = {
      date: moment(Number(history["date"])).format("LLLL"),
      data: JSON.parse(web3.utils.hexToAscii(history["data"])),
      user: history["user"],
    };
    console.log(response)

    res.status(200).send({
      status: 200,
      message: "successfully get data",
      data: response,
    });
  } else {
    res.status(500).send({
      status: 500,
      message: "unsuccessfully get data",
      // data: response,
    });
  }
});

app.get("/ha/history-event", async (req, res) => {
  const { id, privateKey } = req.body;
  //if data
  if (id !== null) {
    let account = await web3.eth.accounts.privateKeyToAccount(privateKey);
    //get chain id
    const chainId = await web3.eth.net.getId();
    //get network id
    const deployedNetwork = homeAssistantABI.networks[`${chainId}`];
    //get contract address
    const contractAddress = deployedNetwork.address;

    //contract
    let homeAssistantContractInstance = await new web3.eth.Contract(
      homeAssistantABI.abi,
      contractAddress
    );
    // encode ABI from smart contract
    let historyEvent = homeAssistantContractInstance.events.History(function(e){
      console.log(e)
    });
    console.log("historyEvent => ", historyEvent);
    // const response = {
    //   date: moment(Number(history["date"])).format('LLLL'),
    //   data: JSON.parse(web3.utils.hexToAscii(history["data"])),
    //   user: history["user"],
    // };

    res.status(200).send({
      status: 200,
      message: "successfully get data",
      historyEvent
      // data: response,
    });
  } else {
    res.status(500).send({
      status: 500,
      message: "unsuccessfully get data",
      data: response,
    });
  }
});

app.get("/create-account", async (req, res) => {
  const account = await web3.eth.accounts.create();
  res.send(account);
});

app.listen(process.env.APP_PORT, () => {
  console.log("Server is running");
});
