exports['test locationAlertController creates locationAlert 1'] = {
  "location_alerts": [
    {
      "id": "",
      "tag_type": "alert",
      "tag_value": "alert",
      "place_id": "testing",
      "brand": "luxuryescapes",
      "google_result": {
        "administrative_area_level_1": "New South Wales",
        "colloquial_area": "Sydney",
        "locality": "",
        "continent": "Oceania",
        "country": "Australia"
      },
      "location_alert": {
        "geocode": {
          "lat": -33.8685,
          "lng": 151.2204
        },
        "level": "colloquial_area",
        "value": "Sydney"
      },
      "available_offers": {
        "continent": [
          "testing001",
          "testing002",
          "testing004",
          "testing003"
        ],
        "country": [
          "testing001",
          "testing002",
          "testing004",
          "testing003"
        ],
        "administrative_area_level_1": [
          "testing001",
          "testing002"
        ],
        "local": [
          "testing002",
          "testing001"
        ]
      }
    }
  ],
  "popular_locations": []
}

exports['test locationAlertController get locations returns locations alerts 1'] = {
  "location_alerts": [],
  "popular_locations": []
}
