# Search Service

A service that allows users to search for available offers by geographical location.

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

## NOTES


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

Offers can be searched using the following methods 

### Get a list of offers using a Google place_id

```
https://${API_BASE_URI}/api/search/destination/${place_id}
```

will return a destination and all the relevant available offers, if nothing is found 404 and empty object.

### Seach using address level and value.


```
https://${API_BASE_URI}/api/search/offer-search/${level}/${value}
```

The given `levels` match the levels found within the Google geo_data object, continent, country, adminstration_level_1, locality, colloquial_area.

### eg: getting offers within the continent of Asia, level = continent value = Asia

```
$ curl https://${API_BASE_URI}/api/search/offer-search/continent/Asia
```  

### eg: getting offers within the country of Australia, level = country value = Australia

```
$ curl https://${API_BASE_URI}/api/search/offer-search/country/Australia
```  

### eg: getting offers within the administration_level_one of New South Wales, level = administration_level_one value = New South Wales

```
$ curl https://${API_BASE_URI}/api/search/offer-search/administration_level_one/New%20South%20Wales
```  

In order to search any level below `administration_level_one` a latitude and longitude has to be included as query params within the URL.
If the `lat` and `lng` query params are detected, the search will default to a geo bounds box search and the level and value are used only as a 
human readable guide within the URL, but have no effect.


### Geo Bounds Box search

To search in a radis of a given `lat` and `lng`, eg: lat=0.00 lng=0.00 (the equator on the greenwich meridian line)

The query param `radius` denotes a radius from the central point in KM, default radius is 20KM.

```
$ curl https://${API_BASE_URI}/api/search/geo-search?lat=0.00&lng=0.00&radius=1000
```  

   
### Notes about search

Both the `level` and `value` URL params are stripped of whitespace and casted to lowercase before a search is peformed, the following two
URL will return the same result

```
$ curl https://${API_BASE_URI}/api/search/offer-search/Continent/Asia
$ curl https://${API_BASE_URI}/api/search/offer-search/continent/asia
```  

## Popular Locations

Popular Locations are locations set by admin users to highlight locations to users, a popular location will be made up of one or more
location alert. a Popular Location might be `NZ & The Pacifc` and be made up of alerts for `New Zealand` , `Fiji` and `The Cook Islands` 

For more information as to how Popular Locations work read the e2e tests for Popular Locations.

A note about the Popular Locations API, it does not follow standard REST architecture.

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
  - destination:{alert.place_id} == key used to store a hash of a destination. 
  - popularLocations key used to store a set of a popularDestiontions. 
  - popularLocation:{popularDestination.tag} key used to store a set of a location alerts, used to make up a popular destination. 

## Data Storage

This service attempts to use a Data Extention within SFMC as a source of true and redis as a localized data source
in order to give users a more reliable and faster recall of thier data. This idea is still a work in progress and will most likely change
from its current state.
