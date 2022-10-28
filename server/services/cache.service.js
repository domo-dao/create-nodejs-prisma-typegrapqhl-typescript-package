const redis = require("redis");
const { redisPort, redisHost } = require("../config/vars");

const url = `redis://${redisHost}:${redisPort}`;
const redisClient = redis.createClient({
  url
});

const cacheService = () => {
  const clearCacheIfExists = async keyName => {
    const matchedCaches = await new Promise((resolve, reject) => {
      redisClient.keys(`*${keyName}*`, (err, keys) => {
        if (err) reject(err);
        resolve(keys);
      });
    });

    let response;
    const errors = [];
    if (matchedCaches.length) {
      await Promise.all(
        matchedCaches.map(async matchedCache => {
          response = await new Promise((resolve, reject) => {
            redisClient.del(matchedCache, err => {
              if (err) reject({ errorMessage: err.message });
              resolve({ sucess: true });
            });
          });
          if (response && response.errorMessage) {
            errors.push(response.message);
          }
        })
      );
    } else {
      response = { sucess: true };
    }
    if (errors.length) {
      response = {
        sucess: false,
        errors
      };
    }
    return response;
  };

  return {
    clearCacheIfExists
  };
};

module.exports = cacheService;
