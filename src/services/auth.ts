import fetch from "node-fetch";
import { AuthResponse } from "../types";
import { logger } from "../lib/logger";

function authorizationToCookie(bearerToken: string): string {
  return `access_token=${bearerToken}`;
}

export async function getUser(requestHeaders: any): Promise<AuthResponse> {
  const url = `https://${process.env.API_BASE_URL}/current_user`;
  delete requestHeaders.host;
  let headers;
  try {
    headers = {
      Origin: `https://${process.env.WEBSITE_BASE_URL}`,
      Cookie:
        requestHeaders.cookie ||
        authorizationToCookie(
          requestHeaders.authorization.replace("Bearer ", "")
        ),
      Authorization: requestHeaders.authorization
    };
  } catch (err) {
    logger("error", "AuthResponse", err);
    return { status: 403, user: undefined };
  }
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
