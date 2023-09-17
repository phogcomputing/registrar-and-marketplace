require("@nomiclabs/hardhat-waffle");
const fs = require('fs');
// const infuraId = fs.readFileSync(".infuraid").toString().trim() || "";
const privateKey = fs.readFileSync(".secret").toString().trim() || "";

module.exports = {
  defaultNetwork: "matic",
  networks: {
    hardhat: {
      chainId: 1337
      //chainId: 42261
    },
/*
    emerald_local: {
      url: "http://localhost:8545",
      accounts: ["af5865b957728b406ca60ac1e67430f6511b99d78d7e30c2203ef1b0d0b39256"],
    },
    emerald_testnet: {
      url: "https://testnet.emerald.oasis.dev",
      //accounts: ["af5865b957728b406ca60ac1e67430f6511b99d78d7e30c2203ef1b0d0b39256"],
      accounts: [privateKey],
    },
    emerald_mainnet: {
      url: "https://emerald.oasis.dev",
      accounts: ["af5865b957728b406ca60ac1e67430f6511b99d78d7e30c2203ef1b0d0b39256"],
    },    

    mumbai: {
      // Infura
      //url: `https://polygon-mumbai.infura.io/v3/f5de33640642405ea6969f958cc5530c`,
      url: "https://rpc-mumbai.matic.today",
      accounts: [privateKey]
    },
*/
    matic: {
      // Infura
      url: `https://polygon-mainnet.infura.io/v3/f5de33640642405ea6969f958cc5530c`,
      //url: "https://rpc-mainnet.maticvigil.com",
      accounts: [privateKey]
    }
   
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};

