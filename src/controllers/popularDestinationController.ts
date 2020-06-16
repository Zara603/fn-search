import { Request, Response } from "express";
import {
  getPopularDestinations,
  createPopularDestination,
  updatePopularDestination,
  deletePopularDestination
} from "../models/popularDestination";
import schemas from "../schema/locationAlertSchema";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  const popularDestinations = await getPopularDestinations();
  return res.json(popularDestinations || []);
}

export async function create(
  req: Request,
  res: Response
): Promise<Response | void> {
  const errors = schemas.locationAlertSchema.match(req.body);
  if (errors.length) {
    res.status(400);
    res.json({ errors });
    return res.end();
  }
  const popularDestination = await createPopularDestination(req.body);
  res.status(201);
  return res.json(popularDestination);
}

export async function update(
  req: Request,
  res: Response
): Promise<Response | void> {
  const errors = schemas.locationAlertSchema.match(req.body);
  if (errors.length) {
    res.status(400);
    res.json({ errors });
    return res.end();
  }
  req.body.id = req.params.id;
  const popularDestination = await updatePopularDestination(req.body);
  res.status(202);
  return res.json(popularDestination);
}

export async function remove(
  req: Request,
  res: Response
): Promise<Response | void> {
  await deletePopularDestination(req.params.id);
  res.status(204);
  return res.end();
}
