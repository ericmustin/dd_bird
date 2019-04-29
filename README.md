# dd_bird
a basic approach to monitoring Bird Scooters in Datadog

## overview
This repository contains a simple express JS server which allows you to submit a country code and zip code, determines the latitude and longitude, returns a list of nearby Bird Scooters available via API, and then submits custom metrics `avgScooterBatteryLevel` and `scooterCount` tagged by `zip` code to Datadog


## setup

- run `npm install`
- add your Datadog `API_KEY` and `APP_KEY` to the `.env` file in this repository. DatadogHQ is a monitoring platform that's free to sign up for at `https://www.datadoghq.com/`.
- add your `http://www.geonames.org/` username to the `.env` file in this repository. GeoNames geographical database api is free to sign up for at `http://www.geonames.org/` (please note you need to enable your username for API access via your user configuration settings at geonames.org)
- start the server at localhost port 3000 by running `npm start` or `node index.js`


## example usage

```
curl -s "http://localhost:3000/?country=FR&zip=75003"

=>
{"data":{"75003":{"avg_scooter_battery_level":83.596,"scooter_count":250}}}
```
