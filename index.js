const https = require('https');
const fs = require('fs');
const apiKey = '**' // get from https://home.openweathermap.org/api_keys
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
var tf = require("@tensorflow/tfjs-node")
var weatherTrainingData = require("./weatherTrainingData.json")
var weatherTestData = require("./weather-testing.json");
var model;
var neuralNetworkOutput = null;
var neededWeatherData = null;
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
    weather: neuralNetworkOutput,
    rawWeather: neededWeatherData[0],
    error: null
  })
});
app.listen(2000, () => {
  console.log("Server online on http://localhost:2000");
});
app.post('/', function(req, res) {
  let rawdata = fs.readFileSync('weatherTrainingData.json');
  let weatherTrainingData = JSON.parse(rawdata);
  let newData = {
      "low": neededWeatherData[0].low,
      "high": neededWeatherData[0].high,
      "temp": neededWeatherData[0].temp,
      "feelsLike": neededWeatherData[0].feelsLike,
      "windSpeed": neededWeatherData[0].windSpeed,
      "pop": neededWeatherData[0].pop,
      "humidity": neededWeatherData[0].humidity,
      "output": req.body.rain + " " + req.body.description
    }
  weatherTrainingData.push(newData);
  let data = JSON.stringify(weatherTrainingData);
  fs.writeFileSync('weatherTrainingData.json', data, (err) => {
    if (err) throw err;
    train();
    res.render("index", {
      weather: neuralNetworkOutput,
      rawWeather: neededWeatherData[0],
      error: null
    })
  });
})


let lat = 40.27;
// TODO not hardcode latitude longitude and use city name to input it
let lon = -81.75;
let url = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lon +
 '&exclude=minutely,alerts&units=imperial&appid=' + apiKey;

https.get(url, (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data+= chunk;
  });
  resp.on('end', () => {
    
  

//let rawdata = fs.readFileSync('weather.json');
let weather = JSON.parse(data); // would be body when put into the above code
let low = weather.daily[0].temp.min;
let high = weather.daily[0].temp.max;
let temp = weather.daily[0].temp.day;
let feelsLike = weather.daily[0].feels_like.day;
let windSpeed = weather.current.wind_speed;
let pop = weather.hourly[0].pop;
console.log(weather);
let humidity = weather.daily[0].humidity;
neededWeatherData = [{
  'low': low,
  'high': high,
  'temp': temp,
  'feelsLike': feelsLike,
  'windSpeed': windSpeed,
  'pop': pop,
  'humidity': humidity
}];




// convert/setup data
const trainingData = tf.tensor2d(weatherTrainingData.map(item => [
  item.low, item.high, item.temp, item.feelsLike, item.windSpeed, item.pop, item.humidity,
]))
const outputData = tf.tensor2d(weatherTrainingData.map(item => [
  item.output == "yes hot" ? 1 : 0,
  item.output == "yes cold" ? 1 : 0,
  item.output == "yes nice" ? 1 : 0,
  item.output == "yes none" ? 1 : 0,
  item.output == "no hot" ? 1 : 0,
  item.output == "no cold" ? 1 : 0,
  item.output == "no nice" ? 1 : 0,
  item.output == "no none" ? 1 : 0,
  item.output == "maybe hot" ? 1 : 0,
  item.output == "maybe cold" ? 1 : 0,
  item.output == "maybe nice" ? 1 : 0,
  item.output == "maybe none" ? 1 : 0,

]))
const testingData = tf.tensor2d(neededWeatherData.map(item => [
  item.low, item.high, item.temp, item.feelsLike, item.windSpeed, item.pop, item.humidity,
]))

// build neural network
model = tf.sequential()

model.add(tf.layers.dense({
  inputShape: [7],
  activation: "sigmoid",
  units: 10,
}))
model.add(tf.layers.dense({
  inputShape: [10],
  activation: "sigmoid",
  units: 12,
}))
// 0 0 0 0 0 0 0 0 0 0 0 0
// a 1 would represent the following from left to right in order
// yes hot, yes cold, yes nice, yes none, no hot, no cold, no nice, no none, maybe hot, maybe cold, maybe nice, maybe none
model.add(tf.layers.dense({
  activation: "sigmoid",
  units: 12,
}))
model.compile({
  loss: "meanSquaredError",
  optimizer: tf.train.adam(.06),
})
// train/fit our network
const startTime = Date.now();
model.fit(trainingData, outputData, {
    epochs: 100
  })
  .then((history) => {
    var results = model.predict(testingData).arraySync();
    for (var i =0; i < results.length; i++) {
      console.log(weatherFromIndex(indexOfMax(results[i])));
      neuralNetworkOutput = weatherFromIndex(indexOfMax(results[i]));
    }
  })
});
}).on("error", (err) => {
  console.log("Error: " + err.message);
});

function indexOfMax(arr) {
  if (arr.length === 0) {
    return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}

function weatherFromIndex(index) {
  switch (index) {
    case 0:
      return "yes hot";
      break;
    case 1:
      return "yes cold";
      break;
    case 2:
      return "yes nice";
      break;
    case 3:
      return "yes none";
      break;
    case 4:
      return "no hot";
      break;
    case 5:
      return "no cold";
      break;
    case 6:
      return "no nice";
      break;
    case 7:
      return "no none";
      break;
    case 8:
      return "maybe hot";
      break;
    case 9:
      return "maybe cold";
      break;
    case 10:
      return "maybe nice";
      break;
    case 11:
      return "maybe none";
      break;
    default:
      break;
  }
}

function train() {
  const trainingData = tf.tensor2d(weatherTrainingData.map(item => [
    item.low, item.high, item.temp, item.feelsLike, item.windSpeed, item.pop, item.humidity,
  ]))
  const outputData = tf.tensor2d(weatherTrainingData.map(item => [
    item.output == "yes hot" ? 1 : 0,
    item.output == "yes cold" ? 1 : 0,
    item.output == "yes nice" ? 1 : 0,
    item.output == "yes none" ? 1 : 0,
    item.output == "no hot" ? 1 : 0,
    item.output == "no cold" ? 1 : 0,
    item.output == "no nice" ? 1 : 0,
    item.output == "no none" ? 1 : 0,
    item.output == "maybe hot" ? 1 : 0,
    item.output == "maybe cold" ? 1 : 0,
    item.output == "maybe nice" ? 1 : 0,
    item.output == "maybe none" ? 1 : 0,

  ]))
  const testingData = tf.tensor2d(neededWeatherData.map(item => [
    item.low, item.high, item.temp, item.feelsLike, item.windSpeed, item.pop, item.humidity,
  ]))
  model.fit(trainingData, outputData, {
      epochs: 100
    })
    .then((history) => {
      var results = model.predict(testingData).arraySync();
      for (var i = 0; i < results.length; i++) {
        console.log(weatherFromIndex(indexOfMax(results[i])));
        neuralNetworkOutput = weatherFromIndex(indexOfMax(results[i]));
      }
    })
}