const redis = require("redis");

const client = redis.createClient({
  host: "127.0.0.1", // or 'localhost'
  port: 6379
});

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

client.connect();

module.exports = client;
