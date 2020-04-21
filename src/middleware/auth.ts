import { Request, Response } from "express";
import { getUser } from "../services/auth";

export async function authMiddleware(
  req: Request,
  resp: Response,
  next: Function
): Promise<void> {
  const authResponse: any = await getUser(req.headers);
  if (authResponse.status !== 200) {
    resp.status(authResponse.status);
    resp.end();
  } else if (!authResponse.user) {
    resp.status(403);
    resp.end();
  } else {
    req.user = {
      personContactId: authResponse.user.result.person_contact_id,
      herokuId: authResponse.user.result.id_member,
      roles: authResponse.user.roles
    };
    next();
  }
}

export async function adminMiddleware(
  req: Request,
  resp: Response,
  next: Function
): Promise<void> {
  const authResponse: any = await getUser(req.headers);
  if (authResponse.status !== 200) {
    resp.status(authResponse.status);
    resp.end();
  } else if (
    !authResponse.user &&
    !authResponse.user.roles.includes("admin-user")
  ) {
    resp.status(403);
    resp.end();
  } else {
    req.user = {
      personContactId: authResponse.user.result.person_contact_id,
      herokuId: authResponse.user.result.id_member,
      roles: authResponse.user.roles
    };
    next();
  }
}
