const Web3 = require("web3");
const contactsABI = require("./src/build/contracts/Contacts.json");
require("dotenv").config();

const web3 = new Web3();

module.exports = async function SaveContact(req, res) {
  const { name, phoneNumber, privateKey } = req.body;

  if (name !== null && phoneNumber !== null) {
    //build user account from privatekey
    let account = await web3.eth.accounts.privateKeyToAccount(privateKey);
    // console.log("accout => ", account)
    //get nonce
    const nonce = await web3.eth.getTransactionCount(account.address, "latest");
    // console.log(nonce)

    //get chain id
    const chainId = await web3.eth.net.getId();
    //get network id
    const deployedNetwork = contactsABI.networks[`${chainId}`];
    // console.log(deployedNetwork)
    const contractAddress = deployedNetwork.address;
    //gas price
    const gasPrice = await web3.eth.getGasPrice();
    // console.log("data config => ", {
    //   chainId,
    //   gasPrice,
    //   deployedNetwork,
    //   account,
    //   nonce
    // })
    //contract
    let contactContractInstance = await new web3.eth.Contract(
      contactsABI.abi,
      deployedNetwork.address
    );
    //   console.log(name, phoneNumber)
    // encode ABI from smart contract
    let createContact = contactContractInstance.methods.createContact(
      web3.utils.toHex(name),
      web3.utils.toHex(phoneNumber)
    );

    // console.log("createContact => ", await createContact.estimateGas());
    const estimatedGas = await createContact.estimateGas();
    const createContactEncodedABI = await createContact.encodeABI();
    console.log("createContactEncodedABI => ", createContactEncodedABI);
    const transaction = {
      // from: account.privateKey,
      // nonce: nonce,
      // chainId: chainId,
      // to: contractAddress,
      // data: createContactEncodedABI,
      // gas: estimatedGas,
      // from: account.privateKey,
      nonce: web3.utils.toHex(nonce),
      // chainId: chainId,
      to: contractAddress,
      data: createContactEncodedABI,
      // gasPrice: web3.utils.toHex(web3.utils.toWei("10", "gwei")),
      gas: 10000000000000 + estimatedGas,
    };

    //sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(
      transaction,
      account.privateKey
    );
    // console.log("signedTx => ", signedTx)
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
};
