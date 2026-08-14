const state = {
  unit: "c",
  weather: null,
  forecast: null,
  suggestions: [],
};

const cityInput = document.getElementById("cityInput");
const suggestionsList = document.getElementById("suggestionsList");
const searchForm = document.getElementById("searchForm");
const statusBanner = document.getElementById("statusBanner");
const weatherContent = document.getElementById("weatherContent");
const loadingState = document.getElementById("loadingState");
const suggestionText = document.getElementById("suggestionText");
const forecastRow = document.getElementById("forecastRow");
const unitToggle = document.getElementById("unitToggle");
const locationButton = document.getElementById("locationButton");

// If the HTML is opened from a file server (e.g. Live Server on port 5500),
// API requests should target the running Express backend on port 3001.
const API_BASE = (function () {
  try {
    const port = location.port;
    // common Live Server port is 5500; if not served by the backend, point to 3001
    if (port && port !== "3001") {
      return "http://localhost:3001";
    }
  } catch (e) {
    // ignore and fall back to same-origin
  }
  return "";
})();

function setStatus(message, tone = "info") {
  statusBanner.hidden = false;
  statusBanner.textContent = message;
  statusBanner.style.background =
    tone === "error"
      ? "rgba(248,113,113,0.18)"
      : tone === "success"
        ? "rgba(74,222,128,0.2)"
        : "rgba(255,255,255,0.12)";
}

function clearStatus() {
  statusBanner.hidden = true;
  statusBanner.textContent = "";
}

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function convertTemp(value) {
  return state.unit === "f" ? (value * 9) / 5 + 32 : value;
}

function toUnitLabel() {
  return state.unit === "f" ? "°F" : "°C";
}

function renderWeather() {
  if (!state.weather) {
    weatherContent.hidden = true;
    return;
  }

  const weather = state.weather;
  weatherContent.hidden = false;
  const emoji = getWeatherEmoji(weather.description, weather.icon);
  weatherContent.innerHTML = `
    <div class="weather-content">
      <div class="weather-main">
        <div>
          <p class="eyebrow">${weather.cityName}, ${weather.country}</p>
          <div class="temp-row">
            <span class="big-temp">${Math.round(convertTemp(weather.temperature))}${toUnitLabel()}</span>
            <div>
              <p>${weather.description}</p>
              <p class="suggestion-text">Feels like ${Math.round(convertTemp(weather.feelsLike))}${toUnitLabel()}</p>
            </div>
          </div>
        </div>
        <div class="weather-emoji" aria-hidden="true">${emoji}</div>
      </div>
      <div class="weather-meta">
        <div class="meta-card"><span class="label">Humidity</span><span class="value">${weather.humidity}%</span></div>
        <div class="meta-card"><span class="label">Wind</span><span class="value">${Math.round(weather.windSpeed)} km/h • ${Math.round(weather.windDirection)}°</span></div>
        <div class="meta-card"><span class="label">Pressure</span><span class="value">${weather.pressure} hPa</span></div>
        <div class="meta-card"><span class="label">Visibility</span><span class="value">${weather.visibility} km</span></div>
        <div class="meta-card"><span class="label">Sunrise</span><span class="value">${formatTime(weather.sunrise)}</span></div>
        <div class="meta-card"><span class="label">Sunset</span><span class="value">${formatTime(weather.sunset)}</span></div>
      </div>
    </div>
  `;

  suggestionText.textContent =
    state.weather.suggestion || "A few helpful suggestions will appear here.";

  if (state.forecast) {
    forecastRow.innerHTML = state.forecast.days
      .map(
        (day) => `
      <article class="forecast-card">
        <h3>${formatDate(day.date)}</h3>
        <div class="weather-emoji" aria-hidden="true">${getWeatherEmoji(day.description, day.icon)}</div>
        <p>${day.description}</p>
        <p class="forecast-temp">${Math.round(convertTemp(day.maxTemp))}${toUnitLabel()} / ${Math.round(convertTemp(day.minTemp))}${toUnitLabel()}</p>
      </article>
    `,
      )
      .join("");
  }

  const condition = weather.description.toLowerCase();
  const isNight = weather.sunset && Date.now() / 1000 > weather.sunset;
  document.body.className = "";
  if (condition.includes("rain")) document.body.classList.add("rain");
  else if (condition.includes("snow")) document.body.classList.add("snow");
  else if (condition.includes("cloud")) document.body.classList.add("clouds");
  else if (condition.includes("thunder"))
    document.body.classList.add("thunderstorm");
  else document.body.classList.add("clear");
  document.body.classList.add(isNight ? "night" : "day");
}

function getWeatherEmoji(description, icon) {
  const d = (description || "").toLowerCase();
  if (d.includes("thunder")) return "⛈️";
  if (d.includes("snow") || d.includes("sleet")) return "❄️";
  if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
  if (d.includes("cloud")) return "☁️";
  if (d.includes("clear") || d.includes("sun")) return "☀️";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze"))
    return "🌫️";
  if (d.includes("wind")) return "🌬️";
  // fallback: map some icon codes to emojis
  if (icon && icon.startsWith("01")) return "☀️";
  if (icon && icon.startsWith("02")) return "⛅";
  if (icon && icon.startsWith("03")) return "☁️";
  if (icon && icon.startsWith("09")) return "🌧️";
  if (icon && icon.startsWith("10")) return "🌦️";
  if (icon && icon.startsWith("11")) return "⛈️";
  return "🌤️";
}

function showLoading() {
  loadingState.hidden = false;
  weatherContent.hidden = true;
}

function hideLoading() {
  loadingState.hidden = true;
}

function getWeatherByCity(city) {
  showLoading();
  clearStatus();
  fetch(`${API_BASE}/api/weather?city=${encodeURIComponent(city)}`)
    .then((response) => response.json())
    .then((payload) => {
      if (!payload.error) {
        state.weather = payload;
        localStorage.setItem("lastCity", city);
        return fetch(
          `${API_BASE}/api/forecast?city=${encodeURIComponent(city)}`,
        );
      }
      throw new Error(payload.error.message);
    })
    .then((response) => response.json())
    .then((forecastPayload) => {
      state.forecast = forecastPayload;
      renderWeather();
      hideLoading();
      setStatus(`Showing weather for ${city}.`, "success");
    })
    .catch((error) => {
      hideLoading();
      setStatus(error.message, "error");
    });
}

function getWeatherByCoords(lat, lon, label) {
  showLoading();
  clearStatus();
  fetch(`${API_BASE}/api/weather?lat=${lat}&lon=${lon}`)
    .then((response) => response.json())
    .then((payload) => {
      if (!payload.error) {
        state.weather = payload;
        return fetch(`${API_BASE}/api/forecast?lat=${lat}&lon=${lon}`);
      }
      throw new Error(payload.error.message);
    })
    .then((response) => response.json())
    .then((forecastPayload) => {
      state.forecast = forecastPayload;
      renderWeather();
      hideLoading();
      setStatus(`Showing weather for ${label || "your location"}.`, "success");
    })
    .catch((error) => {
      hideLoading();
      setStatus(error.message, "error");
    });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedSuggest = debounce((value) => {
  if (!value.trim()) {
    suggestionsList.innerHTML = "";
    suggestionsList.hidden = true;
    return;
  }

  fetch(`${API_BASE}/api/geocode?q=${encodeURIComponent(value)}`)
    .then((response) => response.json())
    .then((payload) => {
      if (!payload.error) {
        state.suggestions = payload.suggestions || [];
        suggestionsList.innerHTML = state.suggestions
          .map(
            (item) =>
              `<li data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.name}, ${item.country}">${item.name}${item.state ? `, ${item.state}` : ""}, ${item.country}</li>`,
          )
          .join("");
        suggestionsList.hidden = state.suggestions.length === 0;
      }
    });
}, 300);

cityInput.addEventListener("input", (event) => {
  debouncedSuggest(event.target.value);
});

suggestionsList.addEventListener("click", (event) => {
  const target = event.target.closest("li");
  if (!target) return;
  const name = target.dataset.name;
  const lat = target.dataset.lat;
  const lon = target.dataset.lon;
  cityInput.value = name;
  suggestionsList.hidden = true;
  getWeatherByCoords(lat, lon, name);
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setStatus("Please enter a city name before searching.", "error");
    return;
  }
  getWeatherByCity(city);
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported in this browser.", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      getWeatherByCoords(
        position.coords.latitude,
        position.coords.longitude,
        "your current location",
      );
    },
    () => {
      setStatus(
        "Location access was denied, so weather could not be determined automatically.",
        "error",
      );
    },
  );
});

unitToggle.addEventListener("click", () => {
  state.unit = state.unit === "c" ? "f" : "c";
  unitToggle.textContent = state.unit === "f" ? "°F" : "°C";
  renderWeather();
});

const lastCity = localStorage.getItem("lastCity");
if (lastCity) {
  cityInput.value = lastCity;
  getWeatherByCity(lastCity);
} else {
  showLoading();
  setTimeout(() => {
    hideLoading();
    suggestionText.textContent =
      "Search for a city to see live conditions and a tailored suggestion.";
  }, 500);
}
