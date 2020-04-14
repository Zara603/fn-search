import * as Redis from "ioredis";
export default new Redis(process.env.REDIS_URL);
