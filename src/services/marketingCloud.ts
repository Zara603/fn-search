import * as FuelSoap from "fuel-soap";
import * as FuelRest from "fuel-rest";
import { ISoapResponse } from "../types";

const SoapClient = new FuelSoap({
  auth: {
    clientId: process.env.MARKETING_CLOUD_API_CLIENT_ID,
    clientSecret: process.env.MARKETING_CLOUD_API_CLIENT_SECRET
  },
  soapEndpoint:
    "https://mckkfx4222l3xk300nzdmzdg55cq.soap.marketingcloudapis.com/Service.asmx"
});

const RestClient = new FuelRest({
  auth: {
    clientId: process.env.MARKETING_CLOUD_API_CLIENT_ID,
    clientSecret: process.env.MARKETING_CLOUD_API_CLIENT_SECRET
  },
  origin: "https://mckkfx4222l3xk300nzdmzdg55cq.rest.marketingcloudapis.com"
});

export async function upsertDataExtensionAsyncByKey(
  externalKey: string,
  items: object[]
): Promise<void> {
  const body = JSON.stringify({ items });
  const response = await RestClient.put({
    uri: `data/v1/async/dataextensions/key:${externalKey}/rows`,
    body
  });
  if (response.res.statusCode !== 202) {
    throw new Error(JSON.stringify(response.body));
  }
  return response.body;
}

export async function getRequest(
  dataExtensionExternalKey: string,
  dataObjectFields: string[]
): Promise<ISoapResponse> {
  const dataObjectName = soapObjectKey(dataExtensionExternalKey);
  return new Promise((resolve, reject) => {
    const options = {};
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

function soapObjectKey(dataObjectName): string {
  return `DataExtensionObject[${dataObjectName}]`;
}

export function buildObjectsFromSoapResponse(soapResponse: any): object[] {
  const incomingObjects: object[] = [];
  soapResponse.Results.forEach(result => {
    const properties = result.Properties.Property;
    const incomingObject = {};
    properties.forEach(prop => {
      incomingObject[prop.Name] = prop.Value;
    });
    incomingObjects.push(incomingObject);
  });
  return incomingObjects;
}
