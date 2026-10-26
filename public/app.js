/* =========================================================
   1. API CONFIGURATION
========================================================= */

// Put your NEW OpenWeatherMap API key inside the quotes.
const API_KEY = "6d9c36ce8bb0aedf5a5598929b2c7e57";

const WEATHER_API = "https://api.openweathermap.org/data/2.5/weather";

const FORECAST_API = "https://api.openweathermap.org/data/2.5/forecast";

const GEOCODING_API = "https://api.openweathermap.org/geo/1.0/direct";

/* =========================================================
   2. APPLICATION STATE
========================================================= */

const state = {
  unit: "c",

  weather: null,

  forecast: null,

  suggestions: [],
};

/* =========================================================
   2b. SAFE FETCH (timeout + clear errors)
========================================================= */

async function fetchJSON(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;

  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw new Error(
      "Network error. Check your internet connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.status, data));
  }

  return data;
}

/* =========================================================
   3. DOM ELEMENTS
========================================================= */

const cityInput = document.getElementById("cityInput");

const suggestionsList = document.getElementById("suggestionsList");

const searchForm = document.getElementById("searchForm");

const statusBanner = document.getElementById("statusBanner");

const weatherContent = document.getElementById("weatherContent");

const loadingState = document.getElementById("loadingState");

const suggestionText = document.getElementById("suggestionText");

const suggestionItems = document.getElementById("suggestionItems");

const forecastRow = document.getElementById("forecastRow");

const unitToggle = document.getElementById("unitToggle");

const locationButton = document.getElementById("locationButton");

const themeToggle = document.getElementById("themeToggle");

const paletteSelect = document.getElementById("paletteSelect");

/* =========================================================
   4. STATUS MESSAGE
========================================================= */

function setStatus(message, tone = "info") {
  statusBanner.hidden = false;

  statusBanner.textContent = message;

  if (tone === "error") {
    statusBanner.style.background = "rgba(248, 113, 113, 0.18)";
  } else if (tone === "success") {
    statusBanner.style.background = "rgba(74, 222, 128, 0.20)";
  } else {
    statusBanner.style.background = "rgba(255, 255, 255, 0.12)";
  }
}

/* =========================================================
   5. CLEAR STATUS
========================================================= */

function clearStatus() {
  statusBanner.hidden = true;

  statusBanner.textContent = "";
}

/* =========================================================
   6. LOADING
========================================================= */

function showLoading() {
  loadingState.hidden = false;

  weatherContent.hidden = true;
}

function hideLoading() {
  loadingState.hidden = true;
}

/* =========================================================
   7. DATE / TIME
========================================================= */

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);

  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* =========================================================
   8. TEMPERATURE CONVERSION
========================================================= */

function convertTemp(value) {
  if (state.unit === "f") {
    return (value * 9) / 5 + 32;
  }

  return value;
}

function getUnitLabel() {
  return state.unit === "f" ? "°F" : "°C";
}

/* =========================================================
   9. WEATHER ICON
========================================================= */

function getWeatherIcon(description, iconCode) {
  const text = (description || "").toLowerCase();

  let iconId = "sun";

  if (text.includes("thunder") || iconCode?.startsWith("11")) {
    iconId = "storm";
  } else if (
    text.includes("snow") ||
    text.includes("sleet") ||
    iconCode?.startsWith("13")
  ) {
    iconId = "snow";
  } else if (
    text.includes("rain") ||
    text.includes("drizzle") ||
    iconCode?.startsWith("09") ||
    iconCode?.startsWith("10")
  ) {
    iconId = "rain";
  } else if (
    text.includes("cloud") ||
    iconCode?.startsWith("02") ||
    iconCode?.startsWith("03") ||
    iconCode?.startsWith("04")
  ) {
    iconId = "cloud";
  } else if (text.includes("clear") || iconCode?.startsWith("01")) {
    iconId = "sun";
  }

  return `

        <svg
            class="weather-icon"
            viewBox="0 0 64 64"
            focusable="false"
            aria-hidden="true"
        >

            <use
                href="icons.svg#${iconId}"
                xlink:href="icons.svg#${iconId}"
            ></use>

        </svg>

    `;
}

/* =========================================================
   10. WEATHER SUGGESTION
========================================================= */

/*
 * Returns:
 *   { message: "short advice", items: [{ icon, label }, ...] }
 *
 * Temperature is in °C and wind is in km/h
 * (the values stored in state.weather).
 */

function generateWeatherSuggestion(weather) {
  const temp = weather.temperature;
  const wind = weather.windSpeed;
  const humidity = weather.humidity;
  const desc = weather.description.toLowerCase();
  const isNight = weather.icon?.endsWith("n");

  const items = [];
  const messages = [];

  const add = (icon, label) => {
    if (!items.some((item) => item.label === label)) {
      items.push({ icon, label });
    }
  };

  const isThunder = desc.includes("thunder");
  const isRain =
    desc.includes("rain") ||
    desc.includes("drizzle") ||
    desc.includes("shower");
  const isSnow = desc.includes("snow") || desc.includes("sleet");
  const isFog =
    desc.includes("mist") ||
    desc.includes("fog") ||
    desc.includes("haze") ||
    desc.includes("smoke");
  const isDust = desc.includes("dust") || desc.includes("sand");
  const isClear = desc.includes("clear");
  const isCloudy = desc.includes("cloud");

  /* ---------- Precipitation / severe weather ---------- */

  if (isThunder) {
    messages.push(
      "Thunderstorms are possible. Stay indoors if you can and avoid open areas.",
    );
    add("🧥", "Raincoat");
    add("☂️", "Umbrella");
    add("🔋", "Charge your phone");
    add("🏠", "Stay indoors");
  } else if (isRain) {
    messages.push("Rain is expected. Dress for the wet and keep dry.");
    add("🧥", "Raincoat");
    add("☂️", "Umbrella");
    add("🥾", "Waterproof shoes");
    add("🎒", "Waterproof bag cover");
  } else if (isSnow) {
    messages.push(
      "Snowy conditions. Dress warmly and watch for slippery roads.",
    );
    add("🧥", "Heavy winter jacket");
    add("🧤", "Gloves");
    add("🧣", "Scarf");
    add("🥾", "Snow boots");
  }

  /* ---------- Visibility / air ---------- */

  if (isFog) {
    messages.push("Reduced visibility. Take extra care if travelling.");
    add("🚗", "Drive slowly");
    add("💡", "Use headlights");
    add("😷", "Mask for hazy air");
  }

  if (isDust) {
    messages.push("Dusty air today. Protect your eyes and lungs.");
    add("😷", "Dust mask");
    add("🕶️", "Sunglasses");
  }

  /* ---------- Temperature ---------- */

  if (temp >= 35) {
    messages.push("It is very hot. Stay hydrated and avoid the midday sun.");
    add("💧", "Water bottle");
    add("🧴", "Sunscreen");
    add("🕶️", "Sunglasses");
    add("🧢", "Cap or hat");
    add("👕", "Light cotton clothes");
    add("🧂", "Electrolytes / ORS");
    if (!isRain && !isThunder) add("☂️", "Umbrella for shade");
  } else if (temp >= 28) {
    messages.push(
      "Warm weather. Wear light clothes and drink plenty of water.",
    );
    add("👕", "Light, breathable clothes");
    add("💧", "Water bottle");
    if (!isCloudy || isClear) {
      add("🧴", "Sunscreen");
      add("🕶️", "Sunglasses");
    }
    if (!isRain && !isThunder && !isNight) add("☂️", "Umbrella for sun");
  } else if (temp >= 20) {
    if (!isRain && !isThunder && !isSnow) {
      messages.push("Pleasant temperature. Light clothing is comfortable.");
    }
    add("👕", "Light clothing");
    if (isClear && !isNight) add("🕶️", "Sunglasses");
  } else if (temp >= 11) {
    messages.push("A bit cool. A light layer will keep you comfortable.");
    add("🧶", "Sweater or light jacket");
  } else if (temp > 0) {
    messages.push("It is cold. Wear warm layers.");
    add("🧶", "Sweater");
    add("🧥", "Warm jacket");
    add("🧣", "Scarf");
    add("🧤", "Gloves");
  } else {
    messages.push("Freezing conditions. Bundle up and limit time outside.");
    add("🧥", "Thermal layers + heavy coat");
    add("🧤", "Gloves");
    add("🧣", "Scarf");
    add("🧢", "Woolen cap");
  }

  /* ---------- Sun ---------- */

  if (isClear && !isNight && temp >= 20 && temp < 28) {
    add("🧴", "Sunscreen");
  }

  /* ---------- Clouds ---------- */

  if (isCloudy && !isRain && !isThunder && !isSnow) {
    messages.push("Cloudy skies. Conditions may change, so keep an eye out.");
    if (temp >= 20) add("☂️", "Compact umbrella just in case");
  }

  /* ---------- Wind ---------- */

  if (wind >= 40) {
    messages.push("Very windy. Secure loose items and be careful outdoors.");
    add("🧥", "Windbreaker");
  } else if (wind >= 25) {
    add("🧥", "Windbreaker");
  }

  /* ---------- Humidity ---------- */

  if (humidity >= 80 && temp >= 26 && !isRain && !isThunder) {
    messages.push("It is humid, so it may feel hotter than it reads.");
    add("👕", "Breathable cotton clothes");
  }

  if (humidity <= 30 && temp >= 15) {
    add("🧴", "Moisturizer / lip balm");
  }

  /* ---------- Night ---------- */

  if (isNight && isClear && temp < 22) {
    add("🧥", "Extra layer for the evening");
  }

  /* ---------- Fallback ---------- */

  if (messages.length === 0) {
    messages.push("Have a great day and stay updated with the weather!");
  }

  return {
    message: messages.slice(0, 2).join(" "),
    items: items.slice(0, 8),
  };
}

/* =========================================================
   10b. RENDER SUGGESTION CHIPS
========================================================= */

function renderSuggestion(suggestion) {
  suggestionText.textContent = suggestion.message;

  suggestionItems.innerHTML = suggestion.items
    .map(
      (item) => `
        <span class="suggestion-chip">
          <span class="chip-icon" aria-hidden="true">${item.icon}</span>
          ${item.label}
        </span>
      `,
    )
    .join("");
}

/* =========================================================
   11. RENDER CURRENT WEATHER
========================================================= */

function renderWeather() {
  if (!state.weather) {
    weatherContent.hidden = true;

    return;
  }

  const weather = state.weather;

  weatherContent.hidden = false;

  const icon = getWeatherIcon(weather.description, weather.icon);

  weatherContent.innerHTML = `

        <div class="weather-content">

            <div class="weather-main">

                <div>

                    <p class="eyebrow">

                        ${weather.cityName},
                        ${weather.country}

                    </p>


                    <div class="temp-row">

                        <span class="big-temp">

                            ${Math.round(convertTemp(weather.temperature))}

                            ${getUnitLabel()}

                        </span>


                        <div>

                            <p>
                                ${weather.description}
                            </p>


                            <p class="suggestion-text">

                                Feels like

                                ${Math.round(convertTemp(weather.feelsLike))}

                                ${getUnitLabel()}

                            </p>

                        </div>

                    </div>

                </div>


                <div
                    class="weather-visual"
                    aria-hidden="true"
                >

                    ${icon}

                </div>

            </div>


            <div class="weather-meta">


                <!-- HUMIDITY -->

                <div class="meta-card">

                    <span class="label">
                        Humidity
                    </span>

                    <span class="value">

                        ${weather.humidity}%

                    </span>

                </div>


                <!-- WIND -->

                <div class="meta-card">

                    <span class="label">
                        Wind
                    </span>

                    <span class="value">

                        ${Math.round(weather.windSpeed)}

                        km/h

                        •

                        ${Math.round(weather.windDirection)}°

                    </span>

                </div>


                <!-- PRESSURE -->

                <div class="meta-card">

                    <span class="label">
                        Pressure
                    </span>

                    <span class="value">

                        ${weather.pressure}
                        hPa

                    </span>

                </div>


                <!-- VISIBILITY -->

                <div class="meta-card">

                    <span class="label">
                        Visibility
                    </span>

                    <span class="value">

                        ${weather.visibility}
                        km

                    </span>

                </div>


                <!-- SUNRISE -->

                <div class="meta-card">

                    <span class="label">
                        Sunrise
                    </span>

                    <span class="value">

                        ${formatTime(weather.sunrise)}

                    </span>

                </div>


                <!-- SUNSET -->

                <div class="meta-card">

                    <span class="label">
                        Sunset
                    </span>

                    <span class="value">

                        ${formatTime(weather.sunset)}

                    </span>

                </div>


            </div>

        </div>

    `;

  renderSuggestion(generateWeatherSuggestion(weather));

  applyWeatherBackground(weather);
}

/* =========================================================
   12. RENDER FORECAST
========================================================= */

function renderForecast() {
  if (!state.forecast || state.forecast.length === 0) {
    forecastRow.innerHTML = `

            <p style="
                color: var(--muted);
                padding: 15px;
            ">

                5-day forecast is unavailable.

            </p>

        `;

    return;
  }

  forecastRow.innerHTML = state.forecast
    .map(
      (day) => `

                    <article
                        class="forecast-card"
                    >

                        <h3>

                            ${formatDate(day.date)}

                        </h3>


                        <div
                            class="weather-visual"
                        >

                            ${getWeatherIcon(day.description, day.icon)}

                        </div>


                        <p>

                            ${day.description}

                        </p>


                        <p
                            class="forecast-temp"
                        >

                            ${Math.round(convertTemp(day.maxTemp))}

                            ${getUnitLabel()}

                            /

                            ${Math.round(convertTemp(day.minTemp))}

                            ${getUnitLabel()}

                        </p>

                    </article>

                `,
    )
    .join("");
}

/* =========================================================
   13. WEATHER BACKGROUND
========================================================= */

function applyWeatherBackground(weather) {
  const description = weather.description.toLowerCase();

  document.body.classList.remove(
    "rain",
    "snow",
    "clouds",
    "thunderstorm",
    "clear",
    "day",
    "night",
  );

  if (description.includes("thunder")) {
    document.body.classList.add("thunderstorm");
  } else if (description.includes("rain") || description.includes("drizzle")) {
    document.body.classList.add("rain");
  } else if (description.includes("snow")) {
    document.body.classList.add("snow");
  } else if (description.includes("cloud")) {
    document.body.classList.add("clouds");
  } else {
    document.body.classList.add("clear");
  }

  const isNight = weather.icon?.endsWith("n");

  document.body.classList.add(isNight ? "night" : "day");
}

/* =========================================================
   14. API ERROR HANDLING
========================================================= */

function getApiErrorMessage(status, data) {
  if (status === 400) {
    return "Invalid request. Please check the city name.";
  }

  if (status === 401) {
    return "Invalid OpenWeatherMap API key. Please check your API key.";
  }

  if (status === 404) {
    return "City not found. Please enter a valid city name.";
  }

  if (status === 408) {
    return "Request timed out. Please try again.";
  }

  if (status === 429) {
    return "Too many API requests. Please try again later.";
  }

  if (status >= 500) {
    return "OpenWeatherMap service is temporarily unavailable.";
  }

  return data?.message || "Unable to retrieve weather information.";
}

/* =========================================================
   15. TRANSFORM WEATHER DATA
========================================================= */

function transformWeatherData(data) {
  return {
    cityName: data.name,

    country: data.sys.country,

    temperature: data.main.temp,

    feelsLike: data.main.feels_like,

    humidity: data.main.humidity,

    windSpeed: data.wind.speed * 3.6,

    windDirection: data.wind.deg || 0,

    pressure: data.main.pressure,

    visibility: data.visibility ? data.visibility / 1000 : 0,

    sunrise: data.sys.sunrise,

    sunset: data.sys.sunset,

    description: data.weather[0].description,

    icon: data.weather[0].icon,
  };
}

/* =========================================================
   16. GET WEATHER BY CITY
========================================================= */

async function getWeatherByCity(city) {
  showLoading();

  clearStatus();

  try {
    /*
     * Direct request:
     *
     * JavaScript → OpenWeatherMap
     */

    const url =
      `${WEATHER_API}` +
      `?q=${encodeURIComponent(city)}` +
      `&appid=${API_KEY}` +
      `&units=metric`;

    const data = await fetchJSON(url);

    /*
     * Store current weather.
     */

    state.weather = transformWeatherData(data);

    /*
     * Save last searched city.
     */

    localStorage.setItem("lastCity", city);

    /*
     * IMPORTANT:
     *
     * Render current weather
     * BEFORE getting forecast.
     *
     * Therefore the application
     * will not remain stuck on
     * "Loading weather..."
     * if forecast fails.
     */

    renderWeather();

    hideLoading();

    setStatus(`Showing weather for ${data.name}.`, "success");

    /*
     * Get forecast separately.
     */

    try {
      await getForecastByCity(city);

      renderForecast();
    } catch (forecastError) {
      console.error("Forecast error:", forecastError);

      state.forecast = null;

      renderForecast();
    }
  } catch (error) {
    hideLoading();

    weatherContent.hidden = true;

    setStatus(error.message, "error");

    console.error("Weather error:", error);
  }
}

/* =========================================================
   17. GET FORECAST BY CITY
========================================================= */

async function getForecastByCity(city) {
  const url =
    `${FORECAST_API}` +
    `?q=${encodeURIComponent(city)}` +
    `&appid=${API_KEY}` +
    `&units=metric`;

  const data = await fetchJSON(url);

  state.forecast = processForecast(data.list);
}

/* =========================================================
   18. PROCESS 5-DAY FORECAST
========================================================= */

function processForecast(list) {
  const groupedDays = {};

  /*
   * OpenWeatherMap gives forecast
   * data every 3 hours.
   *
   * We group records by date.
   */

  list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];

    if (!groupedDays[date]) {
      groupedDays[date] = [];
    }

    groupedDays[date].push(item);
  });

  return Object.keys(groupedDays)

    .slice(0, 5)

    .map((date) => {
      const items = groupedDays[date];

      const temperatures = items.map((item) => item.main.temp);

      /*
       * Find the forecast
       * closest to 12 PM.
       */

      const representative = items.reduce((closest, item) => {
        const currentHour = Number(item.dt_txt.split(" ")[1].slice(0, 2));

        const closestHour = Number(closest.dt_txt.split(" ")[1].slice(0, 2));

        return Math.abs(currentHour - 12) < Math.abs(closestHour - 12)
          ? item
          : closest;
      });

      return {
        date: date,

        maxTemp: Math.max(...temperatures),

        minTemp: Math.min(...temperatures),

        description: representative.weather[0].description,

        icon: representative.weather[0].icon,
      };
    });
}

/* =========================================================
   19. GET WEATHER BY COORDINATES
========================================================= */

async function getWeatherByCoords(lat, lon, label) {
  showLoading();

  clearStatus();

  try {
    /*
     * Current weather.
     */

    const weatherUrl =
      `${WEATHER_API}` +
      `?lat=${lat}` +
      `&lon=${lon}` +
      `&appid=${API_KEY}` +
      `&units=metric`;

    const data = await fetchJSON(weatherUrl);

    state.weather = transformWeatherData(data);

    /*
     * Display current weather
     * immediately.
     */

    renderWeather();

    hideLoading();

    setStatus(`Showing weather for ${label || data.name}.`, "success");

    /*
     * Forecast is loaded separately.
     */

    try {
      const forecastUrl =
        `${FORECAST_API}` +
        `?lat=${lat}` +
        `&lon=${lon}` +
        `&appid=${API_KEY}` +
        `&units=metric`;

      const forecastData = await fetchJSON(forecastUrl);

      state.forecast = processForecast(forecastData.list);

      renderForecast();
    } catch (forecastError) {
      console.error("Forecast error:", forecastError);

      state.forecast = null;

      renderForecast();
    }
  } catch (error) {
    hideLoading();

    weatherContent.hidden = true;

    setStatus(error.message, "error");

    console.error("Location weather error:", error);
  }
}

/* =========================================================
   20. CITY AUTOCOMPLETE
========================================================= */

async function searchCities(value) {
  if (!value.trim()) {
    suggestionsList.innerHTML = "";

    suggestionsList.hidden = true;

    return;
  }

  try {
    const url =
      `${GEOCODING_API}` +
      `?q=${encodeURIComponent(value)}` +
      `&limit=5` +
      `&appid=${API_KEY}`;

    const data = await fetchJSON(url);

    state.suggestions = data;

    suggestionsList.innerHTML = data
      .map(
        (item) => `

                        <li
                            data-lat="${item.lat}"
                            data-lon="${item.lon}"
                            data-name="${item.name}, ${item.country}"
                        >

                            ${item.name}

                            ${item.state ? `, ${item.state}` : ""}

                            , ${item.country}

                        </li>

                    `,
      )
      .join("");

    suggestionsList.hidden = data.length === 0;
  } catch (error) {
    console.error("City suggestion error:", error);

    suggestionsList.hidden = true;
  }
}

/* =========================================================
   21. DEBOUNCE
========================================================= */

function debounce(fn, delay) {
  let timer;

  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedSuggest = debounce(searchCities, 300);

/* =========================================================
   22. SEARCH INPUT
========================================================= */

cityInput.addEventListener("input", (event) => {
  debouncedSuggest(event.target.value);
});

/* =========================================================
   23. SUGGESTION CLICK
========================================================= */

suggestionsList.addEventListener("click", (event) => {
  const target = event.target.closest("li");

  if (!target) {
    return;
  }

  const name = target.dataset.name;

  const lat = target.dataset.lat;

  const lon = target.dataset.lon;

  cityInput.value = name;

  suggestionsList.hidden = true;

  getWeatherByCoords(lat, lon, name);
});

/* =========================================================
   24. SEARCH FORM
========================================================= */

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Please enter a city name before searching.", "error");

    return;
  }

  suggestionsList.hidden = true;

  getWeatherByCity(city);
});

/* =========================================================
   25. GEOLOCATION
========================================================= */

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by this browser.", "error");

    return;
  }

  setStatus("Getting your current location...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      getWeatherByCoords(
        position.coords.latitude,

        position.coords.longitude,

        "your current location",
      );
    },

    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        setStatus("Location permission was denied.", "error");
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setStatus("Your location is currently unavailable.", "error");
      } else if (error.code === error.TIMEOUT) {
        setStatus("Location request timed out.", "error");
      } else {
        setStatus("Unable to determine your location.", "error");
      }
    },

    {
      enableHighAccuracy: true,

      timeout: 10000,

      maximumAge: 300000,
    },
  );
});

/* =========================================================
   26. CELSIUS / FAHRENHEIT
========================================================= */

unitToggle.addEventListener("click", () => {
  state.unit = state.unit === "c" ? "f" : "c";

  unitToggle.textContent = state.unit === "f" ? "°F" : "°C";

  /*
   * No API request is required.
   *
   * We convert the existing
   * Celsius value locally.
   */

  renderWeather();

  renderForecast();
});

/* =========================================================
   27. THEME
========================================================= */

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("theme-light");

    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("theme-light");

    themeToggle.textContent = "🌙";
  }

  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const currentTheme = document.body.classList.contains("theme-light")
    ? "light"
    : "dark";

  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

/* =========================================================
   28. COLOR PALETTE
========================================================= */

function applyPalette(palette) {
  document.body.classList.remove("palette-ocean", "palette-sunset");

  document.body.classList.add(`palette-${palette}`);

  localStorage.setItem("palette", palette);
}

paletteSelect.addEventListener("change", (event) => {
  applyPalette(event.target.value);
});

/* =========================================================
   29. RESTORE THEME
========================================================= */

const savedTheme = localStorage.getItem("theme") || "dark";

applyTheme(savedTheme);

/* =========================================================
   30. RESTORE PALETTE
========================================================= */

const savedPalette = localStorage.getItem("palette") || "ocean";

paletteSelect.value = savedPalette;

applyPalette(savedPalette);

/* =========================================================
   31. RESTORE LAST CITY
========================================================= */

const lastCity = localStorage.getItem("lastCity");

if (lastCity) {
  cityInput.value = lastCity;

  getWeatherByCity(lastCity);
} else {
  hideLoading();

  suggestionText.textContent =
    "Search for a city to see live conditions and a tailored weather suggestion.";
}
