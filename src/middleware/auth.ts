import { Request, Response } from "express";
import { getUser } from "../services/auth";

export async function authMiddleware(
  req: Request,
  resp: Response,
  next: Function
): Promise<void> {
  const authResponse = await getUser(req.headers);
  if (authResponse.status !== 200) {
    resp.status(authResponse.status);
    resp.end();
  } else if (!authResponse.user) {
    resp.status(403);
    resp.end();
  } else {
    next();
  }
}
