/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
import {
    addLevelDBData,
    readLevelDBData,
    getLevelDBData
} from './levelSandbox';

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
    constructor(data) {
        this.hash = '',
        this.height = 0,
        this.body = data,
        this.time = 0,
        this.previousBlockHash = '';
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
    constructor(blockChainExists = false) {
        this.chain = [];
        if (blockChainExists === false) {
            this.createGenesisBlock(new Block('Genesis Block - I am the first block on the chain'));
        }
        this.getChain();
    }
    //adding Genesis Block
    createGenesisBlock(genesisBlock) {
        if (this.chain.length === 0) {
            console.log('Adding the first Block - the Genesis Block!\n');
            genesisBlock.height = 1;
            genesisBlock.time = new Date().getTime().toString().slice(0, -3);
            genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
            console.log(genesisBlock);
            return addLevelDBData(this.chain.length + 1, JSON.stringify(genesisBlock).toString()).then(() => {
                this.getChain();
            });
        } else {
            this.getChain();
        }
    }

    //getting the full chain
    getChain() {
        return readLevelDBData().then((dataArray) => {
            return new Promise((resolve, reject) => {
                this.chain = [];
                this.chain = dataArray;
                resolve();
            });
        });
    }

    // Add new block
    addBlock(newBlock) {
        console.log('adding following block...\n');
        this.getChain();
        if (this.chain.length > 0) {
            return this.getBlock(this.chain.length).then((value) => {
                // UTC timestamp
                newBlock.time = new Date().getTime().toString().slice(0, -3);
                // Block height
                newBlock.height = this.chain.length + 1;
                // previous block hash
                newBlock.previousBlockHash = JSON.parse(value).hash;
                newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                return addLevelDBData(this.chain.length + 1, JSON.stringify(newBlock).toString());
                // (JSON.parse(this.chain[this.chain.length-1].value).hash);;
                //Hier verbinden mit previousHash!!!
            });
        } else {
            console.log('Genesis Block is missing\n');
            return;
        }
    }

    // Get block height
    getBlockHeight() {
        return readLevelDBData().then((dataArray) => {
            return new Promise((resolve) => {
                this.chain = [];
                this.chain = dataArray;
                let height = this.chain.length;
                resolve(height);
            });
        });
    }

    // get block
    getBlock(blockHeight) {
        return getLevelDBData(blockHeight.toString()).then((value) => {
            return new Promise((resolve) => {
                resolve(value);
            });
        });
    }

    // validate block
    validateBlock(blockHeight) {
    // get block object
        return this.getBlock(blockHeight).then((requestedBlock) => {
            return new Promise((resolve, reject) => {
                let block = JSON.parse(requestedBlock);
                // get block hash
                let blockHash = block.hash;
                // remove block hash to test block integrity
                block.hash = '';
                // generate block hash
                let validBlockHash = SHA256(JSON.stringify(block)).toString();
                // Compare
                if (blockHash === validBlockHash) {
                    console.log('Block #' + block.height + ' is valid\n');
                    resolve(block.height);
                } else {
                    console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
                    reject(block.height);
                }
            });
        });

    }

    //validate every block on the chain
    validateChain() {
        let PromiseArray = [];
        return this.getChain().then(() => {
            for (var i = 1; i <= this.chain.length; i++) {
                PromiseArray.push(this.validateBlock(i));
            }
            Promise.all(PromiseArray)
                .then((results) => {
                    console.log('Following blocks are valid: ' + results + '\n');
                })
                .catch((e) => {
                    console.log('Invalid Blocks' + e + '\n');
                });

        });
    }
}

// function to start or add a block on the chain
const startBlockChain = (message) => {
    return new Promise(function(resolve, reject) {
        readLevelDBData().then((dataArray) => {
            let blockChainExists = false;
            //Checking if Blockchain exists already
            if (dataArray.length > 0) {
                console.log('Blockchain exists already!\n');
                blockChainExists = true;
                return blockChainExists;
            } else {
                return blockChainExists;
            }
        }).catch((err) => {
            console.log('First catch was called' + err + '\n');
            return;
        }).then((blockChainExists) => {
            // Depending on the result before a new Blockchain with or without the GenesisBlock is generated
            if (!blockChainExists) {
                console.log('A new blockchain is generated!\n');
                var myBlockChain = new Blockchain();
                return myBlockChain;
            } else {
                console.log('--> so old Blockchain will be adopted\n');
                var myBlockChain = new Blockchain(true);
                return myBlockChain;
            }
        }).catch((err) => {
            console.log('Second Error occured and was catched: ' + err + '\n');
        }).then((myBlockChain) => {
            return myBlockChain;
        }).then((myBlockChain) => {
            setTimeout(function() {
                //Adding the Block with the message the user entered
                let blockTest = new Block('Test Block - ' + (myBlockChain.chain.length + 1) + ' contains message: ' + message + '\n');
                myBlockChain.addBlock(blockTest).then((result) => {
                    console.log(JSON.parse(result));
                    myBlockChain.getChain();
                    setTimeout((function logBlockchain() {
                        console.log(myBlockChain);
                        process.exit();
                    }), 10000);
                });
            }, 100);
            // Getting the current height of the chain
            myBlockChain.getBlockHeight().then((height) => {
                console.log('Current number of blocks in the chain: ' + height + '\n');
            });
            // validate Chain
            myBlockChain.validateChain();
        });
    });
};

//Listener for Terminal! Test it out :)
(function Listener() {
    var stdin = process.openStdin();
    console.log('Please enter a message which will be secured on the blockchain or press "CTRL + C" to exit: \n');
    stdin.addListener('data', function(d) {
        console.log('You entered: [' + d.toString().trim() + ']\n');
        startBlockChain(d.toString().trim());
    });
})();
