# Search Service

A lambda function that allows us to perform searchers against our current offerst.

### Prerequisites

To get up and running

```
$ yarn install
```

Then

```
$ yarn run dev
```

## Running the tests

```
$ yarn run test
```

## Deployment

This repo is deployed using Apex up

## NOTE

For all following curl examples subsitute ${ACCESS_TOKEN} and ${API_BASE_URI} for your given user and enviroment.

${ALERT_ID} is the UUID of the given Destination Alert.

## Indexing Offer Data into REDIS:

```
$ curl -i https://${API_BASE_URI}/api/search/index-offers -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

This command will get all offers listed in public offer and index the searchable data into REDIS.

## Creating a user Destination Alert:

```
$ curl -d '{"google_result":{"continent":"Oceania","country":"Australia","administrative_area_level_1":"New South Wales","locality":"","colloquial_area":"Sydney"},"location_alert":{"level":"colloquial_area","value":"Sydney","geocode":{"lng":22.001,"lat":22.001}}}' -H "Content-Type: application/json" -H 'Cookie:access_token='"$ACCESS_TOKEN"''  https://${API_BASE_URI}/api/search/location-alert

```

## Updating a user Destination Alert:

```
$ curl -i -X PATCH -d '{"google_result":{"continent":"Oceania","country":"Australia","administrative_area_level_1":"New South Wales","locality":"","colloquial_area":"Sydney"},"location_alert":{"level":"colloquial_area","value":"Sydney","geocode":{"lng":23.001,"lat":23.001}}}' -H "Content-Type: application/json" -H 'Cookie:access_token='"$ACCESS_TOKEN"''  https://${API_BASE_URI}/api/search/location-alert/${ALERT_ID}
```

## Deleting a user Destination Alert:

```
$ curl -X DELETE  -H 'Cookie:access_token='"$ACCESS_TOKEN"''  https://${API_BASE_URI}/api/search/location-alert/${ALERT_ID}
```


## Data Storage

This service attempts to use a Data Extention within SFMC as a source of true and redis as a localized data source
in order to give users a more reliable and faster recall of thier data. This idea is still a work in progress and will most likely change
from its current state.
