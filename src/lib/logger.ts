export function logger(level: string, message: string, fields = {}) {
  const entry = { level, message, fields };
  console.log(JSON.stringify(entry));
}
