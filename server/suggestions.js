function generateSuggestions(weatherData) {
  const temp = weatherData.temperature;
  const description = weatherData.description.toLowerCase();
  const windSpeed = weatherData.windSpeed || 0;
  const precipitation = weatherData.precipitation || 0;
  const isRain =
    description.includes("rain") || description.includes("drizzle");
  const isSnow = description.includes("snow") || description.includes("sleet");
  const isStorm =
    description.includes("thunderstorm") || description.includes("storm");

  let base = "";

  // The thresholds below are intentionally explicit so the guidance feels specific,
  // rather than relying on a vague "it is cold" or "it is hot" message.
  if (temp < 5) {
    base =
      "It is quite chilly, so a heavy jacket, gloves, and a few layers will help today.";
  } else if (temp < 15) {
    base =
      "The air is cool, so a light jacket or sweater would feel comfortable.";
  } else if (temp < 25) {
    base =
      "Conditions are mild, so light layers should be plenty for the day ahead.";
  } else {
    base =
      "It is warm, so light fabrics and plenty of water would be a smart choice.";
  }

  if (isSnow) {
    base += " Snow is in the forecast, so boots with good traction would help.";
  } else if (isRain || precipitation > 0.2) {
    base += " Rain is likely, so an umbrella or rain shell would be useful.";
  }

  if (windSpeed > 30) {
    base +=
      " The wind is strong, so a windbreaker or something to block the breeze would help.";
  }

  if (isStorm) {
    base +=
      " Thunderstorms are possible, so it is wise to keep plans flexible and stay sheltered if needed.";
  }

  if (weatherData.uvIndex > 6) {
    base +=
      " UV levels are high, so sunscreen and a hat are worth applying sooner rather than later.";
  } else if (weatherData.uvIndex > 3) {
    base +=
      " UV levels are moderate, so sunscreen is still a good idea if you will be outside.";
  }

  return base.trim();
}

module.exports = { generateSuggestions };
