const { createClient } = require("redis");

let client;

async function initRedis(redisUrl) {
  client = createClient({ url: redisUrl });
  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();
}

async function getCache(key) {
  if (!client) return null;
  const v = await client.get(key);
  return v ? JSON.parse(v) : null;
}

async function setCache(key, value, ttlSeconds = 3600) {
  if (!client) return;
  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

module.exports = { initRedis, getCache, setCache };
