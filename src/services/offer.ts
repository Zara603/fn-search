const offerBase = process.env.OFFERS_HOST + '/api/'
import fetch from "node-fetch"

export async function getOffers(): Promise<any> {
  const url = `https://${process.env.API_BASE_URL}/api/public-offers`
  console.log(url)
  const limit = 25
  let hasMore = true
  let page = 1
  let offers = []
  while(hasMore) {
    let response = await fetch(url)
    let data = await response.json()
    offers = offers.concat(data.result)
    if(data.total <= page * limit) {
      hasMore = false
    }
    page++
  }
  return offers
}
