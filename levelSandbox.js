/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

// new Promise is like fetch a method which returns a promise and then can be used with then or catch

// Add data to levelDB with key/value pair
export const addLevelDBData = (key,value) => {
    return new Promise((resolve) => {
        db.put(key, value, function(err) {
            if (err) return console.log('Block ' + key + ' submission failed', err);
            resolve(value);
        });
    });
};

// Get data from levelDB with key
export const getLevelDBData = (key) => {
    return new Promise((resolve) => {
    //if undefined => err
        db.get(key, function(err, value) {
            if (err) return console.log('Not found!', err);
            // when resolved => passes value to the next .then(value)
            resolve(value);
        });
    });
};

export const readLevelDBData = () => {
    return new Promise((resolve, reject) => {
        let dataArray = [];
        db.createReadStream()
            .on('data', function (data) {
                dataArray.push(data);
            })
            .on('error', function (err) {
                reject(err);
            })
            .on('close', function () {
                resolve(dataArray);
            });
    });
};

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/
