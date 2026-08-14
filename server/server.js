const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const { fetchWeather, fetchForecast, fetchGeocode } = require("./weatherApi");
const { generateSuggestions } = require("./suggestions");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function sendError(res, status, type, message) {
  res.status(status).json({ error: { type, message } });
}

app.get("/api/geocode", async (req, res) => {
  const query = req.query.q;
  if (!query || !query.trim()) {
    return sendError(
      res,
      400,
      "invalid_request",
      "Please enter a city name to search.",
    );
  }

  try {
    const suggestions = await fetchGeocode(query.trim());
    return res.json({ suggestions });
  } catch (error) {
    return sendError(
      res,
      error.status || 500,
      error.type || "server_error",
      error.message || "Geocoding failed.",
    );
  }
});

app.get("/api/weather", async (req, res) => {
  const city = req.query.city;
  const lat = req.query.lat;
  const lon = req.query.lon;

  if (!city && !(lat && lon)) {
    return sendError(
      res,
      400,
      "invalid_request",
      "Please provide a city name or location coordinates.",
    );
  }

  try {
    const data = await fetchWeather({ city, lat, lon });
    const suggestion = generateSuggestions(data);
    return res.json({ ...data, suggestion });
  } catch (error) {
    return sendError(
      res,
      error.status || 500,
      error.type || "server_error",
      error.message || "Unable to fetch the current weather.",
    );
  }
});

app.get("/api/forecast", async (req, res) => {
  const city = req.query.city;
  const lat = req.query.lat;
  const lon = req.query.lon;

  if (!city && !(lat && lon)) {
    return sendError(
      res,
      400,
      "invalid_request",
      "Please provide a city name or location coordinates.",
    );
  }

  try {
    const data = await fetchForecast({ city, lat, lon });
    return res.json(data);
  } catch (error) {
    return sendError(
      res,
      error.status || 500,
      error.type || "server_error",
      error.message || "Unable to fetch the forecast.",
    );
  }
});

// Simple health endpoint for load balancers and quick checks
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Weather app listening at http://localhost:${port}`);
});
