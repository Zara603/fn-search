import fetch from "node-fetch";
import { AuthResponse } from "../types";
import { logger } from "../lib/logger";

export async function getUser(requestHeaders: any): Promise<AuthResponse> {
  const url = `https://${process.env.API_BASE_URL}/current_user`;
  delete requestHeaders.host;
  requestHeaders.origin = `https://${process.env.WEBSITE_BASE_URL}`;
  const options = {
    method: "GET",
    headers: requestHeaders
  };
  console.log(url, options);
  try {
    const resp = await fetch(url, options);
    if (resp.status !== 200) {
      logger("error", "AuthResponse", resp);
      return { status: resp.status, user: undefined };
    }
    const authUser = await resp.json();
    return { status: resp.status, user: authUser };
  } catch (err) {
    logger("error", "AuthResponse", err);
    return { status: 400, user: undefined };
  }
}
