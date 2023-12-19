const Web3 = require("web3");
// const moment = require("moment");
require("dotenv").config();
// contract ABI
const homeAssistantABI = require("../../build/contracts/HomeAssistant.json");

const web3 = new Web3();
web3.setProvider(
  new web3.providers.HttpProvider(
    `${process.env.PROTOCOL}://${process.env.BLOCKCHAIN_URI}:${process.env.BLOCKCHAIN_PORT}`
  )
);

exports.createHistory = async function (privateKey, data) {
  if ((privateKey !== null && data !== null)) {
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
    // const gasPrice = await web3.eth.getGasPrice();
    // console.log(gasPrice);

    //contract
    let homeAssistantContractInstance = await new web3.eth.Contract(
      homeAssistantABI.abi,
      deployedNetwork.address
    );
    // encode ABI from smart contract
    let createHistory =
      await homeAssistantContractInstance.methods.createHistory(
        web3.utils.toHex(JSON.stringify(data)),
        web3.utils.toHex(Date.now()),
        web3.utils.toHex(account.address) //public key
      );

    const estimatedGas = await createHistory.estimateGas();
    // console.log(estimatedGas);
    const createHistoryEncodedABI = await createHistory.encodeABI();
    const transaction = {
      // from: account.privateKey,
      nonce: web3.utils.toHex(nonce),
      // chainId: chainId,
      to: contractAddress,
      data: createHistoryEncodedABI,
      // gasPrice: web3.utils.toHex(web3.utils.toWei("10", "gwei")),
      gas: estimatedGas,
    };

    //sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(
      transaction,
      account.privateKey
    );

    const txCallback = async (err, hash) => {
      try {
        //send oke response
        const response = {
          hash: hash,
        };
        // console.log(response);
      } catch (e) {        
        const newTx = {
          nonce: web3.utils.toHex(nonce),
          to: contractAddress,
          data: createHistoryEncodedABI,
          gas: estimatedGas,
          gasPrice: estimatedGas * 2,
        };
        const newSignedTx = await web3.eth.accounts.signTransaction(
          newTx,
          account.privateKey
        );
        await web3.eth.sendSignedTransaction(
          web3.utils.toHex(newSignedTx.rawTransaction),
          async (e, res) => {}
        );
      }
    };

    //if tx signed, then send the data to the blockchain
    const signedTransaction = await web3.eth.sendSignedTransaction(
      web3.utils.toHex(signedTx.rawTransaction),
      txCallback
    );

    if (signedTransaction) {
      //send oke response
      const response = {
        error: null,
        blockHash: signedTransaction.blockHash,
        blockNumber: signedTransaction.blockNumber,
        transactionHash: signedTransaction.transactionHash,
        gasUsed: signedTransaction.gasUsed,
        status: signedTransaction.status,
      };
      return response;
    }
  }
};
