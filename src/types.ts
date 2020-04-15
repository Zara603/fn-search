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

interface IAlert {
  level: string;
  value: string;
  geocode: IGeocode;
}

export interface IAlertObject {
  google_result: IGoogleResult;
  location_alert: IAlert;
  id?: string;
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
  herokuId: string;
  personContactId: string;
}
