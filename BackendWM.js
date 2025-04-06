const express=require('express');
require("dotenv").config();
const app=express();
const axios=require("axios");
const cors=require("cors");
const path = require('path');
const { timeStamp } = require('console');

const PORT=process.env.PORT || 3000;
const IPSTACK_API_KEY=process.env.IPSTACK_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname,'public')));

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','MainForm.html'));
});

app.get("/weather", async (req, res) => {
    try {
        const { lat, lon, unit="°C",windUnit="Km/h",precUnit="mm" } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: "Missing latitude or longitude" });
        }

        // Fetch weather data from WeatherAPI
        const response = await axios.get(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}`
        );

        const forecast= await axios.get(
            `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=1&aqi=no&alerts=no`
        )

        const forecastData= forecast.data;
        const weatherData = response.data;

        console.log("Full forecast API Response:", JSON.stringify(forecastData,null,2));

        console.log("Full API Response:", JSON.stringify(weatherData, null, 2));
        const tempC = weatherData.current.temp_c;
        const tempF = weatherData.current.temp_f;
        console.log(tempF);
        const tempK = tempC + 273.15; // Convert Celsius to Kelvin

        const highTempC=forecastData.forecast.forecastday[0].day.maxtemp_c;
        const lowTempC=forecastData.forecast.forecastday[0].day.mintemp_c;

        const highTempF = forecastData.forecast.forecastday[0].day.maxtemp_f;
        const lowTempF = forecastData.forecast.forecastday[0].day.mintemp_f;

        const highTempK = highTempC + 273.15;
        const lowTempK = lowTempC + 273.15;

        const windKmh=weatherData.current.wind_kph;
        const windMph=weatherData.current.wind_mph;

        const highWindKmh=forecastData.forecast.forecastday[0].day.maxwind_kph;
        const lowWindKmh = Math.min(...forecastData.forecast.forecastday[0].hour.map(hour => hour.wind_kph));

        const highWindMph=forecastData.forecast.forecastday[0].day.maxwind_mph;
        const lowWindMph=Math.min(...forecastData.forecast.forecastday[0].hour.map(hour => hour.wind_mph));

        console.log(highWindMph);
        console.log(lowWindMph);

        const precMm=weatherData.current.precip_mm;
        const precIn=weatherData.current.precip_in;
        

        const localTime=weatherData?.location?.localtime || "Unavailable";
        let currentDay, currentTime;

        if (localTime !== "Unavailable") {
            [currentDay, currentTime] = localTime.split(" ");
        }

        let temperature;
        let windSpeed;
        let precipitation;
        let highTemperature;
        let lowTemperature;
        let HighWindSpeed;
        let LowWindSpeed;
        
        if (unit === "°F") {
            temperature = tempF; // Use Fahrenheit
            highTemperature = highTempF;
            lowTemperature = lowTempF;
        } else if (unit === "K") {
            temperature = tempK.toFixed(2); // Use Kelvin (rounded to 2 decimal places)
            highTemperature = highTempK.toFixed(2);
            lowTemperature = lowTempK.toFixed(2);
        } else {
            temperature = tempC; // Default to Celsius
            highTemperature = highTempC;
            lowTemperature = lowTempC;
        }

        if(windUnit==="M/h"){
            windSpeed=windMph;
            HighWindSpeed=highWindMph;
            LowWindSpeed=lowWindMph
        }
        else{
            windSpeed=windKmh;
            HighWindSpeed=highWindKmh;
            LowWindSpeed=lowWindMph;
        }

        if(precUnit==="mm"){
            precipitation=precMm;
        }
        else{
            precipitation=precIn;
        }

        res.json({
            temperature: temperature,
            highTemperature: highTemperature,
            lowTemperature: lowTemperature,
            windSpeed: windSpeed,
            LowWindSpeed:LowWindSpeed,
            HighWindSpeed:HighWindSpeed,
            precipitation: precipitation,
            unit: unit,
            windUnit: windUnit,
            precUnit: precUnit,
            temp_c: tempC,
            temp_f: tempF,
            temp_k: tempK.toFixed(2), // Round to 2 decimal places
            high_temp_c: highTempC,
            low_temp_c: lowTempC,
            high_temp_f: highTempF,
            low_temp_f: lowTempF,
            high_temp_k: highTempK.toFixed(2),
            low_temp_k: lowTempK.toFixed(2),
            wind_kph: windKmh,
            wind_mph: windMph,
            maxwind_mph:highWindMph,
            maxwind_kph:highWindKmh,
            minwind_mph:lowWindMph,
            minwind_kph:lowWindKmh,
            precip_mm: precMm,
            precip_in: precIn,
            condition: weatherData.current.condition.text,
            icon: weatherData.current.condition.icon,
            timeStamp: Date.now(),
            currentDay,
            currentTime
        });

    } catch (error) {
        console.error("Error fetching weather data:", error.message);
        
    }
});

app.get("/weather/search", async (req, res) => {
    try {
        const { city, unit = "°C",windUnit="Km/h",precUnit="mm"} = req.query;

        if (!city) {
            return res.status(400).json({ error: "City name is required" });
        }

        // Fetch weather data based on city name
        const response = await axios.get(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city}`
        );

        const forecast= await axios.get(
            `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${city}&days=1&aqi=no&alerts=no`
        )
        const forecastData= forecast.data;
        const weatherData = response.data;

        console.log("Full API Response:", JSON.stringify(weatherData, null, 2));
        console.log("Full forecast API Response:", JSON.stringify(forecastData,null,2));
        const tempC = weatherData.current.temp_c;
        const tempF = weatherData.current.temp_f;
        const tempK = tempC + 273.15; // Convert Celsius to Kelvin

        const highTempC=forecastData.forecast.forecastday[0].day.maxtemp_c;
        const lowTempC=forecastData.forecast.forecastday[0].day.mintemp_c;

        const highTempF = forecastData.forecast.forecastday[0].day.maxtemp_f;
        const lowTempF = forecastData.forecast.forecastday[0].day.mintemp_f;

        const highTempK = highTempC + 273.15;
        const lowTempK = lowTempC + 273.15;

        const windKmh=weatherData.current.wind_kph;
        const windMph=weatherData.current.wind_mph;

        const highWindKmh=forecastData.forecast.forecastday[0].day.maxwind_kph;
        const lowWindKmh = Math.min(...forecastData.forecast.forecastday[0].hour.map(hour => hour.wind_kph));

        const highWindMph=forecastData.forecast.forecastday[0].day.maxwind_mph;
        const lowWindMph=Math.min(...forecastData.forecast.forecastday[0].hour.map(hour => hour.wind_mph));

        const precMm=weatherData.current.precip_mm;
        const precIn=weatherData.current.precip_in;

        const localTime=weatherData?.location?.localtime || "Unavailable";
        const timezoneOffset = weatherData?.location?.tz_id || "UTC"; // Get timezone string
        let currentDay, originalTime;

        if (localTime !== "Unavailable") {
            [currentDay, originalTime] = localTime.split(" ");
        }

        // Determine the temperature unit
        let temperature;
        let windSpeed;
        let precipitation;
        let highTemperature;
        let lowTemperature;
        let HighWindSpeed;
        let LowWindSpeed;

        if (unit === "°F") {
            temperature = tempF;
            highTemperature = highTempF;
            lowTemperature = lowTempF;
        } else if (unit === "K") {
            temperature = tempK.toFixed(2);
            highTemperature = highTempK.toFixed(2);
            lowTemperature = lowTempK.toFixed(2);
        } else {
            temperature = tempC;
            highTemperature = highTempC;
            lowTemperature = lowTempC;
        }

        if(windUnit==="M/h"){
            windSpeed=windMph;
            HighWindSpeed=highWindMph;
            LowWindSpeed=lowWindMph
        }
        else{
            windSpeed=windKmh;
            HighWindSpeed=highWindKmh;
            LowWindSpeed=lowWindKmh;
        }

        if(precUnit==="mm"){
            precipitation=precMm;
        }
        else{
            precipitation=precIn;
        }

        res.json({
            location: weatherData.location.name,
            country: weatherData.location.country,
            longitude: weatherData.location.lon,
            latitude: weatherData.location.lat,
            temperature: temperature,
            highTemperature: highTemperature,
            lowTemperature: lowTemperature,
            windSpeed: windSpeed,
            LowWindSpeed:LowWindSpeed,
            HighWindSpeed:HighWindSpeed,
            precipitation: precipitation,
            unit: unit,
            windUnit: windUnit,
            precUnit: precUnit,
            temp_c: tempC,
            temp_f: tempF,
            temp_k: tempK.toFixed(2),
            high_temp_c: highTempC,
            low_temp_c: lowTempC,
            high_temp_f: highTempF,
            low_temp_f: lowTempF,
            high_temp_k: highTempK.toFixed(2),
            low_temp_k: lowTempK.toFixed(2),
            wind_kph: windKmh,
            wind_mph: windMph,
            maxwind_mph:highWindMph,
            maxwind_kph:highWindKmh,
            minwind_mph:lowWindMph,
            minwind_kph:lowWindKmh,
            precip_mm: precMm,
            precip_in: precIn,
            condition: weatherData.current.condition.text,
            icon: weatherData.current.condition.icon,
            timeStamp: Date.now(),
            currentDay,
            originalTime,
        });

    } catch (error) {
        console.error("Error fetching weather data:", error.message);
    }
});


app.get("/location",async(req,res)=>{
    try{
        const ip='8.8.8.8';
        //req.headers["x-forwarded-for"]||req.socket.remoteAddress;

        const locationType=req.query.type||'city';

        const response=await axios.get(`http://api.ipstack.com/${ip}?access_key=${IPSTACK_API_KEY}`);
        console.log("IPStack Response: ", response.data);

        if (locationType === 'coordinates') {
            // Send latitude and longitude
            res.json({
                latitude: response.data.latitude,
                longitude: response.data.longitude
            });
        } else if (locationType === 'city') {
            // Send city and country
            res.json({
                city: response.data.city,
                country: response.data.country_name,
                latitude: response.data.latitude,
                longitude: response.data.longitude
            });
        } else {
            res.status(400).json({ error: "Invalid location type. Use 'coordinates' or 'city'." });
        }

    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(PORT,()=>{
    console.log(`Server running at http://localhost:${PORT}`);
})

