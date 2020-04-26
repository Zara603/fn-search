import * as FuelSoap from "fuel-soap";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger";
import {
  ISoapResponse,
  ISoapResult,
  IAlertObject,
  IProperty,
  IUser
} from "../types";

const SoapClient = new FuelSoap({
  auth: {
    clientId: process.env.MARKETING_CLOUD_API_CLIENT_ID || "invalid-client-id",
    clientSecret:
      process.env.MARKETING_CLOUD_API_CLIENT_SECRET || "invalid-client-secret"
  },
  soapEndpoint:
    "https://mckkfx4222l3xk300nzdmzdg55cq.soap.marketingcloudapis.com/Service.asmx"
});

async function getRequest(
  dataObjectName: string,
  dataObjectFields: string[],
  userId: string
): Promise<ISoapResponse> {
  return new Promise((resolve, reject) => {
    const options = {
      filter: {
        leftOperand: "herokuId",
        operator: "equals",
        rightOperand: userId
      }
    };
    SoapClient.retrieve(
      dataObjectName,
      dataObjectFields,
      options,
      (err: any, response: any) => {
        if (err) {
          return reject(err);
        }
        return resolve(response.body);
      }
    );
  });
}

async function createUpdateRequest(
  locationAlert: IAlertObject,
  user: IUser
): Promise<ISoapResponse> {
  const updateOptions = {
    SaveOptions: [
      {
        SaveOption: {
          PropertyName: "DataExtensionObject",
          SaveAction: "UpdateAdd"
        }
      }
    ]
  };
  const updateValues = createUpdateObject(user, locationAlert);
  return new Promise((resolve, reject) => {
    SoapClient.update(
      "DataExtensionObject",
      updateValues,
      updateOptions,
      (err: any, response: any) => {
        if (err) {
          logger("error", "Error Createing/Updating alert", err);
          return reject(err);
        }
        return resolve(response.body);
      }
    );
  });
}

function createUpdateObject(user: IUser, locationAlert: IAlertObject): any {
  if (!locationAlert.id) {
    locationAlert.id = uuidv4();
  }
  return {
    CustomerKey: process.env.DATA_EXTENSION_KEY,
    Keys: [{ Key: { Name: "id", Value: locationAlert.id } }],
    Properties: {
      Property: [
        { Name: "personContactId", Value: user.personContactId },
        { Name: "herokuId", Value: user.herokuId },
        { Name: "level", Value: locationAlert.location_alert.level },
        { Name: "value", Value: locationAlert.location_alert.value },
        { Name: "lng", Value: locationAlert.location_alert.geocode.lng },
        { Name: "lat", Value: locationAlert.location_alert.geocode.lat },
        {
          Name: "continent",
          Value: locationAlert.google_result.continent || ""
        },
        { Name: "country", Value: locationAlert.google_result.country || "" },
        {
          Name: "administrative_area_level_1",
          Value: locationAlert.google_result.administrative_area_level_1 || ""
        },
        {
          Name: "colloquial_area",
          Value: locationAlert.google_result.colloquial_area || ""
        },
        { Name: "locality", Value: locationAlert.google_result.locality || "" }
      ]
    }
  };
}

function createDeleteObject(id: string, user: IUser): any {
  return {
    CustomerKey: process.env.DATA_EXTENSION_KEY,
    Keys: [{ Key: { Name: "id", Value: id } }],
    Properties: {
      Property: [
        { Name: "personContactId", Value: user.personContactId },
        { Name: "herokuId", Value: user.herokuId }
      ]
    }
  };
}

async function deleteRequest(id: string, user: IUser): Promise<ISoapResponse> {
  const deleteValues = createDeleteObject(id, user);
  return new Promise((resolve, reject) => {
    SoapClient.delete(
      "DataExtensionObject",
      deleteValues,
      (err: any, response: any) => {
        if (err) {
          logger("error", "Error deleting alert", err);
          return reject(err);
        }
        return resolve(response.body);
      }
    );
  });
}

function buildObject(properties: IProperty[]): any {
  const resultObject = {};
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    resultObject[property.Name] = property.Value;
  }
  return resultObject;
}

function buildAlertObject(results: ISoapResult[]): IAlertObject[] {
  const alertsList: IAlertObject[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const properties = result.Properties.Property;
    const resultObject = buildObject(properties);
    const alertObject = {
      id: resultObject.id,
      google_result: {
        continent: resultObject.continent,
        country: resultObject.country,
        locality: resultObject.locality,
        colloquial_area: resultObject.colloquial_area
      },
      location_alert: {
        level: resultObject.level,
        value: resultObject.value,
        geocode: {
          lat: resultObject.lat,
          lng: resultObject.lng
        }
      }
    };
    alertsList.push(alertObject);
  }
  return alertsList;
}

function soapObjectKey(dataObjectName): string {
  return `DataExtensionObject[${dataObjectName}]`;
}

export async function getUserDestinationAlertsSFMC(
  user: IUser
): Promise<IAlertObject[]> {
  const dataObjectName = soapObjectKey(process.env.DATA_EXTENSION_KEY);
  const response = await getRequest(
    dataObjectName,
    [
      "level",
      "value",
      "lng",
      "lat",
      "continent",
      "country",
      "administrative_area_level_1",
      "locality",
      "colloquial_area",
      "id"
    ],
    user.herokuId || ""
  );
  return buildAlertObject(response.Results);
}

export async function createUserDestinationAlertSFMC(
  locationAlert: IAlertObject,
  user: IUser
): Promise<void> {
  await createUpdateRequest(locationAlert, user);
}

export async function updateUserDestinationAlertSFMC(
  locationAlert: IAlertObject,
  user: IUser
): Promise<void> {
  await createUpdateRequest(locationAlert, user);
}

export async function deleteUserDestinationAlertSFMC(
  id: string,
  user: IUser
): Promise<void> {
  await deleteRequest(id, user);
}
