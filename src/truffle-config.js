const HDWalletProvider = require("@truffle/hdwallet-provider");
//pass an array of private keys, and optionally use a certain subset of addresses
const privateKeys = [
  "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
  "c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
  "ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
];
provider = new HDWalletProvider(privateKeys, "http://10.0.2.15:8545"); //start at address_index 0 and load both addresses

module.exports = {
  networks: {
    development: {
      host: "10.0.2.15",
      port: 8545,
      network_id: "*", // Match any network id
    },
    besu: {
      provider: provider,
      network_id: "*", // Match any network id
    },
  },
  compilers: {
    solc: {
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200, // Default: 200
        },
      },
    },
  },
};
