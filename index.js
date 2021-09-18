const request = require('request');
const fs = require('fs');
const apiKey = '**' // get from https://home.openweathermap.org/api_keys
const express = require('express');
const app = express();
const bodyParser = require("body-parser");

//Set view engine to ejs
app.set("view engine", "ejs");

//Tell Express where we keep our index.ejs
app.set("views", "views");
app.use(express.static('public'))

//Use body-parser
app.use(bodyParser.urlencoded({
  extended: false
}));

//Instead of sending Hello World, we render index.ejs
app.get("/", (req, res) => {
  res.render("index", {
    weather: neededWeatherData,
    weatherString: JSON.stringify(neededWeatherData),
    error: null
  })
});
app.listen(2000, () => {
  console.log("Server online on http://localhost:2000");
});



/*let lat = 40.42;
// TODO not hardcode latitude longitude and use city name to input it
let lon = -86.90;
let url = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lon +
 '&exclude=current,minutely,hourly,alerts&units=imperial&appid=' + apiKey;

//pulling data from weather.json just to not use too many api requests rn
request(url, function (err, response, body) {
  if (err) {
    console.log('error:', err);
  } else {
    fs.writeFile("weather.json", body, function (err) {
      if (err) {
        console.log(err);
      }
    });
  }
});*/

let rawdata = fs.readFileSync('weather.json');
let weather = JSON.parse(rawdata); // would be body when put into the above code
let low = weather.daily[0].temp.min;
let high = weather.daily[0].temp.max;
let temp = weather.daily[0].temp.day;
let feelsLike = weather.daily[0].feels_like.day;
let windSpeed = weather.daily[0].wind_speed;
let pop = weather.daily[0].pop;
let humidity = weather.daily[0].humidity;
let neededWeatherData = {
  'low': low,
  'high': high,
  'temp': temp,
  'feelsLike': feelsLike,
  'windSpeed': windSpeed,
  'pop': pop,
  'humidity': humidity
};