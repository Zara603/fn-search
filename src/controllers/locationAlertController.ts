import { Request, Response } from "express";
import {
  getUserDestinationAlerts,
  createUserDestinationAlert,
  updateUserDestinationAlert,
  deleteUserDestinationAlert
} from "../models/destinationAlert";
import schemas from "../schema/locationAlertSchema";
import { logger } from "../lib/logger";

export async function getAlerts(
  req: Request,
  res: Response
): Promise<Response | void> {
  const alerts = await getUserDestinationAlerts(req.user);
  return res.json(alerts);
}

export async function createAlert(
  req: Request,
  res: Response
): Promise<Response | void> {
  const errors = schemas.locationAlertSchema.match(req.body);
  if (errors.length) {
    res.status(400);
    logger("error", "Schema Error", errors);
    res.json({ errors });
    return res.end();
  }
  try {
    await createUserDestinationAlert(req.body, req.user);
  } catch (err) {
    logger("error", "Error updating alert", err);
    res.status(500);
    return res.json("Error updating alert");
  }
  res.status(201);
  return res.json(req.body);
}

export async function updateAlert(
  req: Request,
  res: Response
): Promise<Response | void> {
  const errors = schemas.locationAlertSchema.match(req.body);
  if (errors.length) {
    res.status(400);
    logger("error", "Schema Error", errors);
    res.json({ errors });
    return res.end();
  }
  req.body.id = req.params.id;
  try {
    await updateUserDestinationAlert(req.body, req.user);
  } catch (err) {
    logger("error", "Error updating alert", err);
    res.status(500);
    return res.json("Error updating alert");
  }
  res.status(201);
  return res.json(req.body);
}

export async function deleteAlert(
  req: Request,
  res: Response
): Promise<Response | void> {
  try {
    await deleteUserDestinationAlert(req.params.id, req.user);
  } catch (err) {
    logger("error", "Error deleting alert", err);
    return res.status(500);
  }
  return res.status(204);
}
