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

### Unit Tests
```
$ yarn run test
```

### e2e Tests
```
$ yarn run test:e2e
```
Note, you will need redis running locally in order to run e2e tests.

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
It will also clean up all offers that are no longer found within the public-offers API.

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

## Searching for offers

Offers can be searched for using two methods, geo bounds box or using a search term

### Geo Bounds Box search

To search in a radis of a given `lat` and `lng`, eg: lat=0.00 lng=0.00 (the equator on the greenwich meridian line)

The query param `radius` denotes a radius from the central point in KM, default radius is 20KM.

```
$ curl https://${API_BASE_URI}/api/search/geo-search?lat=0.00&lng=0.00&radius=1000
```  

### Search using a search term

Search terms do not have to be full words in order to match `aus` will match `Australia`, `Austria` and all other words that contain `aus`.

Search terms are case insensitive, all whitespace is removed during search.

The search is performed against the holidayTypes, admin set locations array, Geo country, continent and administrative_area_level_1 data.

```
$ curl https://${API_BASE_URI}/api/search/offer-search?search=aus
```  

## Popular Locations

Popular Locations are locations set by admin users to highlight locations to users, a popular location will be made up of one or more
location alert. a Popular Location might be `NZ & The Pacifc` and be made up of alerts for `New Zealand` , `Fiji` and `The Cook Islands` 

For more information as to how Popular Locations work read the e2e tests for Popular Locations

##Redis Keys

All redis keys currently have a prefix that helps with identifying the object, keys are as follows:

  - offer:{id_salesforce_external} == key used for offer.
  - locations:world == key used in sorted set into which all the offers are indexed with their lat and lng.
  - locations:continent:{continent_name} == key used in sorted set for which offers are saved against the continent they are found in. 
  - locations:country:{country_name} == key used in sorted set for which offers are saved against the country they are found in. 
  - locations:name:{name} == key used in sorted set for which offers are saved against the admin given locations. 
  - locations:holidayType:{holidayType} == key used in sorted set for which offers have a certain holidayType. 
  - locations:country:{country_name} == key used in sorted set for which offers are saved against the country they are found in. 
  - destinationAlerts:{user.UUID} == key used to store a list of destination alert for that user. 
  - alert:{alert.UUID} == key used to store a hash of a destination alert. 
  - popularLocations key used to store a set of a popularDestiontions. 
  - popularLocation:{popularDestination.tag} key used to store a set of a location alerts, used to make up a popular destination. 

## Data Storage

This service attempts to use a Data Extention within SFMC as a source of true and redis as a localized data source
in order to give users a more reliable and faster recall of thier data. This idea is still a work in progress and will most likely change
from its current state.
