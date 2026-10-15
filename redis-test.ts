import "dotenv/config";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

console.log("REDIS_URL set:", !!process.env.UPSTASH_REDIS_REST_URL);
console.log("REDIS_TOKEN set:", !!process.env.UPSTASH_REDIS_REST_TOKEN);

(async () => {
  try {
    const ping = await redis.ping();
    console.log("PING:", ping);
    const rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "10s") });
    const { success } = await rl.limit("test-user");
    console.log("RATELIMIT success:", success);
  } catch (e: any) {
    console.log("REDIS ERROR:", e.name, e.message);
  }
})();
