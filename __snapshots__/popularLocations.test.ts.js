exports['test e2e Popular Locations create popular locations 1'] = [
  {
    "tag": "NZ & The Pacific",
    "image_id": "testing",
    "available_offers": [
      "0060T00000275OlQAI",
      "0060T0000028OD7QAM",
      "0060I00000Uy9DnQAJ",
      "0060I00000Y42b9QAB",
      "00628000005ISxJAAW"
    ]
  }
]

exports['test e2e Popular Locations update popular location 1'] = [
  {
    "tag": "NZ & The Pacific",
    "image_id": "testing",
    "available_offers": [
      "0060T00000275OlQAI",
      "0060T0000028OD7QAM",
      "0060I00000Uy9DnQAJ",
      "0060I00000Y42b9QAB",
      "00628000005ISxJAAW"
    ]
  }
]

exports['test e2e Popular Locations add popular location 1'] = `
tag: NZ & The Pacific added to users alerts
`

exports['test e2e Popular Locations delete popular location 1'] = {
  "location_alerts": [],
  "popular_locations": []
}
