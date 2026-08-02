const https = require("https");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

function buildUrl(pathname, params) {
  const url = new URL(`${BASE_URL}${pathname}`);
  url.searchParams.set("appid", API_KEY);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const message = parsed.message || "Weather request failed.";
            const error = new Error(message);
            error.status = res.statusCode;
            error.type =
              res.statusCode === 404
                ? "city_not_found"
                : res.statusCode === 429
                  ? "rate_limited"
                  : res.statusCode >= 500
                    ? "server_error"
                    : "request_failed";
            return reject(error);
          }
          resolve(parsed);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });

    req.on("error", (err) => {
      err.type = "network_error";
      reject(err);
    });
  });
}

async function fetchWeather({ city, lat, lon }) {
  if (!API_KEY) {
    const error = new Error("OpenWeatherMap API key is missing.");
    error.status = 500;
    error.type = "server_error";
    throw error;
  }

  const params = { units: "metric" };
  let url;
  if (city) {
    url = buildUrl("/weather", { q: city, ...params });
  } else {
    url = buildUrl("/weather", { lat, lon, ...params });
  }

  const data = await requestJson(url);
  const { main, weather, wind, sys, visibility, coord } = data;
  return {
    cityName: data.name,
    country: sys.country,
    temperature: main.temp,
    feelsLike: main.feels_like,
    description: weather[0].description,
    icon: weather[0].icon,
    humidity: main.humidity,
    windSpeed: wind.speed,
    windDirection: wind.deg,
    pressure: main.pressure,
    visibility: visibility / 1000,
    sunrise: sys.sunrise,
    sunset: sys.sunset,
    uvIndex: 0,
    precipitation: 0,
    coord,
    raw: data,
  };
}

async function fetchForecast({ city, lat, lon }) {
  if (!API_KEY) {
    const error = new Error("OpenWeatherMap API key is missing.");
    error.status = 500;
    error.type = "server_error";
    throw error;
  }

  const params = { units: "metric", cnt: 40 };
  let url;
  if (city) {
    url = buildUrl("/forecast", { q: city, ...params });
  } else {
    url = buildUrl("/forecast", { lat, lon, ...params });
  }

  const data = await requestJson(url);
  const grouped = data.list.reduce((acc, item) => {
    const day = item.dt_txt.split(" ")[0];
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(item);
    return acc;
  }, {});

  const days = Object.entries(grouped)
    .slice(0, 5)
    .map(([date, entries]) => {
      const midday =
        entries.find((entry) => entry.dt_txt.includes("12:00:00")) ||
        entries[0];
      const temps = entries.map((entry) => entry.main.temp);
      return {
        date,
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        description: midday.weather[0].description,
        icon: midday.weather[0].icon,
        precipitation:
          entries.reduce((sum, entry) => sum + (entry.pop || 0), 0) /
          entries.length,
        windSpeed: midday.wind.speed,
        humidity: midday.main.humidity,
      };
    });

  return { days, cityName: data.city.name, country: data.city.country };
}

async function fetchGeocode(query) {
  if (!API_KEY) {
    const error = new Error("OpenWeatherMap API key is missing.");
    error.status = 500;
    error.type = "server_error";
    throw error;
  }

  const url = buildUrl("/find", { q: query, units: "metric", type: "like" });
  const data = await requestJson(url);
  return data.list.slice(0, 5).map((item) => ({
    name: item.name,
    country: item.sys.country,
    state: item.state || "",
    lat: item.coord.lat,
    lon: item.coord.lon,
  }));
}

module.exports = { fetchWeather, fetchForecast, fetchGeocode };
