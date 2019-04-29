require('dotenv').config();
const faker = require('faker');    
const dogapi = require('dogapi');
const Bird = require('node-bird');
const axios = require('axios');
const express = require('express');
const average = arr => arr.reduce( (p, c) => p + c, 0 ) / arr.length;

let bird = new Bird();
let config = { dd_options: { api_key: process.env.API_KEY, app_key: process.env.APP_KEY}, geonames_username: process.env.USERNAME};

dogapi.initialize(config.dd_options)

// module.exports = async function (req) {
let init = async (req,res) => {
  try {
    // get zip code lat/lng and format, throw error if missing
    let [zip, country] = [req.query.zip, req.query.country]

    if (zip === undefined || country === undefined) { throw "please submit a zip and country code" }

    let geoApiDetails = `http://api.geonames.org/postalCodeSearchJSON?maxRows=1&username=${config.geonames_username}&country=${country}&postalcode=${zip}`
    let geoInfo = await axios.get(geoApiDetails)
    let mappedGeoInfo = {[zip]: { "lat": geoInfo.data.postalCodes[0]["lat"], "lng": geoInfo.data.postalCodes[0]["lng"]} }
    
    //register token w/any email then get+format scooters in 500m radius of zip code lat/lng
    await bird.login(faker.internet.email()); 
    let results = await Promise.all([bird.getScootersNearby(mappedGeoInfo[zip]["lat"],mappedGeoInfo[zip]["lng"])])

    let mapped = results.reduce( (mapping, zip_scooter_list) => {
      if (mapping[zip] === undefined) { mapping[zip] = {} }

      if (zip_scooter_list.length === 0) { console.warn(`no scooters found for: ${zip}`) }

      mapping[zip]['avg_scooter_battery_level'] = average(zip_scooter_list.map( (scoot) => scoot.battery_level))
      mapping[zip]['scooter_count'] = zip_scooter_list.length
      return mapping
    },{})

    //send bird custom metrics to DD with zip code tags
    let dd_results_count = await Promise.all( Object.keys(mapped).map( (x) => dogapi.metric.send("bird.scooterCount", mapped[x]['scooter_count'], {tags: "zip:"+x})))
    let dd_results_battery = await Promise.all( Object.keys(mapped).map( (x) =>  dogapi.metric.send("bird.avgScooterBatteryLevel", mapped[x]['avg_scooter_battery_level'], {tags: "zip:"+x})))
    res.send(200, {data: mapped})
  } catch (err) {
    console.log('error',err);
    res.send(404, 'error')
  }
}

// initialize server
const app = express();
const listener = app.listen(3000, () => console.log('app is listening on port ' + listener.address().port ) )
app.get('*', init)