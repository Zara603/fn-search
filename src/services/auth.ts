import fetch from "node-fetch";
import { AuthResponse } from "../types";
import { logger } from "../lib/logger";

export async function getUser(requestHeaders: any): Promise<AuthResponse> {
  const url = `https://${process.env.API_BASE_URL}/current_user`;
  delete requestHeaders.host;
  const headers = {
    Origin: `https://${process.env.WEBSITE_BASE_URL}`,
    Cookie: requestHeaders.cookie
  };
  const options = {
    method: "GET",
    headers
  };
  try {
    const resp = await fetch(url, options);
    if (resp.status !== 200) {
      logger("error", "AuthResponse", resp.status);
      return { status: resp.status, user: undefined };
    }
    const authUser = await resp.json();
    return { status: resp.status, user: authUser };
  } catch (err) {
    logger("error", "AuthResponse", err);
    return { status: 400, user: undefined };
  }
}
