#!/bin/bash

# args $1 api base url eg http://localhost:8080
# $2 jwt token

RED=`tput setaf 1`
GREEN=`tput setaf 2`
RESET=`tput sgr0`
CREATE_BODY='{"google_result":{"continent":"Oceania","country":"Australia","administrative_area_level_1":"New South Wales","locality":"","colloquial_area":"Sydney"},"location_alert":{"level":"colloquial_area","value":"Sydney","geocode":{"lng":150.2093,"lat":-33.8688}}}'
UPDATE_BODY='{"google_result":{"continent":"Asia","country":"Australia","administrative_area_level_1":"New South Wales","locality":"","colloquial_area":"Sydney"},"location_alert":{"level":"colloquial_area","value":"Sydney","geocode":{"lng":150.2093,"lat":-33.8688}}}'

echo "Testing calling get offers without token"
status_code=$(curl --write-out %{http_code} --silent --output /dev/null "$1"/api/search/location-alert)

if [[ "$status_code" -ne 403 ]] ; then
  echo "${RED} Auth on api/search/index-offers returning status code: $status_code ${RESET}\n" 
  exit 1
else  
  echo "${GREEN}Auth on api/search/index-offers working${RESET}\n"
fi

echo "Testing calling get offers with token"
status_code=$(curl --write-out %{http_code} --silent --output /dev/null "$1"/api/search/location-alert -H 'Cookie:access_token='"$2"'')

if [[ "$status_code" -ne 200 ]] ; then
  echo ${RED}"api/search/index-offers returning status code: $status_code${RESET}\n" 
  exit 1
else
  echo "${GREEN}api/search/index-offers working${RESET}\n"
fi

echo "Testing creating destination alert"
response=$(curl -w "| %{http_code}" -X POST "$1"/api/search/location-alert -H 'Cookie:access_token='"$2"'' -H "Content-Type: application/json"  -d "${CREATE_BODY}")
status_code=$(echo $response | awk -F\| '{print $2}')
response_body=$(echo $response | awk -F\| '{print $1}')
response_id=$(echo $response_body | jq -r .id)
echo $response_id

if [[ "$status_code" -ne 201 ]] ; then
  echo ${RED}"create destination alert returning status code: ${status_code}${RESET}\n" 
  exit 1
else
  echo "${GREEN}create destination alert working ${status_code} ${RESET}\n"
fi

echo "Testing updating destination alert"
response=$(curl -w "| %{http_code}" -X PATCH "$1"/api/search/location-alert/"${response_id}" -H 'Cookie:access_token='"$2"'' -H "Content-Type: application/json"  -d "${UPDATE_BODY}")
status_code=$(echo $response | awk -F\| '{print $2}')
response_body=$(echo $response | awk -F\| '{print $1}')
updated_field=$(echo $response_body | jq -r .google_result.continent)

if [[ "$updated_field" -ne "Asia" ]] ; then
  echo ${RED}"update destination alert returning status code: ${status_code}${RESET}\n" 
  exit 1
else
  echo "${GREEN}update destination alert working ${status_code} ${RESET}\n"
fi

#echo "Testing deleteing destination alert"
#status_code=$(curl -w "%{http_code}" -X DELETE "$1"/api/search/location-alert/"${response_id}" -H 'Cookie:access_token='"$2"'' -H "Content-Type: application/json"  -d "${UPDATE_BODY}")
#
#if [[ "$status_code" -ne 204 ]] ; then
#  echo ${RED}"delete destination alert returning status code: ${status_code}${RESET}\n" 
#  exit 1
#else
#  echo "${GREEN}delete destination alert working ${status_code} ${RESET}\n"
#fi
#
#echo "Testing deleteing destination alert worked"
#response=$(curl --w "| %{http_code}" "$1"/api/search/location-alert -H 'Cookie:access_token='"$2"'')
#
#if echo "$response" | grep -q "$response_id" ; then
#  echo ${RED}"delete destination alert returning status code: ${status_code}${RESET}\n" 
#  exit 1
#else
#  echo "${GREEN}delete destination alert working ${status_code} ${RESET}\n"
#fi
