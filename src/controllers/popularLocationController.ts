import { Request, Response } from "express";
import {
  getPopularLocations,
  createPopularLocation,
  updatePopularLocation,
  deletePopularLocation,
  addPopularLocation,
  removePopularLocation
} from "../models/popularLocation";
import schemas from "../schema/locationAlertSchema";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  const popularLocations = await getPopularLocations();
  return res.json(popularLocations || []);
}

export async function create(
  req: Request,
  res: Response
): Promise<Response | void> {
  const errors = schemas.popularLocationsSchema.match(req.body);
  console.log("whats the issue");
  if (errors.length) {
    res.status(400);
    res.json({ errors });
    return res.end();
  }
  const popularLocation = await createPopularLocation(req.body);
  res.status(201);
  return res.json(popularLocation);
}

export async function update(
  req: Request,
  res: Response
): Promise<Response | void> {
  const errors = schemas.popularLocationsSchema.match(req.body);
  if (errors.length) {
    res.status(400);
    res.json({ errors });
    return res.end();
  }
  const popularLocation = await updatePopularLocation(req.body);
  res.status(202);
  return res.json(popularLocation);
}

export async function remove(
  req: Request,
  res: Response
): Promise<Response | void> {
  await deletePopularLocation(req.body.tag);
  return res.status(204);
}

export async function addPopularTag(
  req: Request,
  res: Response
): Promise<Response | void> {
  const errors = schemas.tagSchema.match(req.body);
  if (errors.length) {
    res.status(400);
    res.json({ errors });
    return res.end();
  }
  await addPopularLocation(req.body.tag, req.user);
  res.status(201);
  return res.json(`tag: ${req.body.tag} added to users alerts`);
}

export async function removePopularTag(
  req: Request,
  res: Response
): Promise<Response | void> {
  const errors = schemas.tagSchema.match(req.body);
  if (errors.length) {
    res.status(400);
    res.json({ errors });
    return res.end();
  }
  await removePopularLocation(req.body.tag, req.user);
  res.status(204);
  return res.json(`tag: ${req.body.tag} removed from users alerts`);
}
