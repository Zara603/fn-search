import redis from "../lib/redis";

const KEY_LIMIT = process.env.KEY_LIMIT || 100;

export async function getAllHashes(keys: string[]): Promise<any[]> {
  const pipeline = redis.pipeline();
  keys.forEach(key => {
    pipeline.hgetall(key);
  });
  const results = await pipeline.exec();
  return results.map(result => result[1]);
}

async function getAllOffersFromKeys(keys: string[]): Promise<any[]> {
  const pipeline = redis.pipeline();
  keys.forEach(key => {
    pipeline.zrange(key, 0, -1);
  });
  const results = await pipeline.exec();
  const nestedResults = results.map(result => result[1]);
  const flatResults = nestedResults.flat();
  const offerKeys = flatResults.map(result => `offer:${result}`);
  const offerIds: any = new Set(offerKeys);
  return await getAllHashes(offerIds);
}

export function stringsToKeys(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

export async function searchRedis(searchTerm: string): Promise<any[]> {
  const cleanedSearchTerm = searchTerm.toLowerCase().replace(/\s+/g, "");
  const keys = await redis.scan(
    0,
    "MATCH",
    `locations:*:*${stringsToKeys(cleanedSearchTerm)}*`,
    "COUNT",
    KEY_LIMIT
  );
  return await getAllOffersFromKeys(keys[1]);
}
