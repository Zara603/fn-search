import * as s from "strummer";

const geoCodeSchema = {
  lng: s.number(),
  lat: s.number(),
}

const alertSchema = {
  level: s.string(),
  value: s.string(),
  geocode: s.objectWithOnly(geoCodeSchema),
}

const googleResultSchema = {
  continent: s.string(),
  country: s.string(),
  administrative_area_level_1: s.string(),
  locality: s.string(),
  colloquial_area: s.string(),
}

const locationAlertSchema = {
  google_result: s.objectWithOnly(googleResultSchema),
  location_alert: s.objectWithOnly(alertSchema),
}

const schemas = {
  locationAlertSchema: s.objectWithOnly(locationAlertSchema)
}

export default schemas
