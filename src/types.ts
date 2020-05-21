interface IGoogleResult {
  continent?: string;
  country?: string;
  administrative_area_level_1?: string;
  locality?: string;
  colloquial_area?: string;
}

interface IGeocode {
  lat?: number;
  lng?: number;
}

export interface IAvailableOffers {
  continent: string[];
  country: string[];
  administrative_area_level_1: string[];
  local: string[];
}

interface IAlert {
  level: string;
  value: string;
  geocode: IGeocode;
}

export interface IAlertObject {
  place_id: string;
  google_result: IGoogleResult;
  location_alert: IAlert;
  id?: string;
  available_offers?: IAvailableOffers;
  created_at?: string;
}

export interface IPopularLocation {
  id?: string;
  tag: string;
  location_alerts: IAlertObject[];
}

export interface IProperty {
  Name: string;
  Value: string;
}

export interface IProperties {
  Property: IProperty[];
}

export interface ISoapResult {
  PartnerKey: string;
  ObjectID: string;
  Type: string;
  Properties: IProperties;
}

export interface ISoapResponse {
  OverallStatus: string;
  RequestID: string;
  Results: ISoapResult[];
}

export interface AuthResponse {
  status: number;
  user: any | null;
}

export interface IUser {
  herokuId?: string;
  personContactId?: string;
  roles?: string[];
}
