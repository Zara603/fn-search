import redis from "../lib/redis";

export async function getAllHashes(keys: string[]): Promise<any[]> {
  const pipeline = redis.pipeline();
  keys.forEach(key => {
    pipeline.hgetall(key);
  });
  const results = await pipeline.exec();
  return results.map(result => result[1]);
}
