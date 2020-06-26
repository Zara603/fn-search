exports['test Popular Locations create popular locations 1'] = [
  {
    "tag": "NZ & The Pacific",
    "image_id": "testing",
    "available_offers": [
      "testing001",
      "testing002",
      "testing004",
      "testing003"
    ]
  }
]

exports['test Popular Locations update popular location 1'] = [
  {
    "tag": "NZ & The Pacific",
    "image_id": "testing",
    "available_offers": [
      "testing001",
      "testing002",
      "testing004",
      "testing003"
    ]
  }
]

exports['test Popular Locations add popular location 1'] = `
tag: NZ & The Pacific added to users alerts
`

exports['test Popular Locations delete popular location 1'] = {
  "location_alerts": [],
  "popular_locations": []
}
