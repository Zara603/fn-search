export function cleanAlertResponse(response) {
  // in order to do snapshot testing we remove all the 
  // dynamic values such as dates before checking the snapshots
  response.location_alerts.forEach(alt => { delete alt.created_at})
}
