# Weather Forecast Web App

A polished weather forecast experience built with Node.js and Express. The app uses the OpenWeatherMap API through a backend proxy so the API key never needs to be exposed in the client.

## What is included

- City search with debounced autocomplete suggestions
- Current conditions including temperature, feels like, humidity, wind, pressure, visibility, and sunrise/sunset
- A 5-day forecast presented as a horizontally scrollable row of cards
- A “Use my location” button that uses the browser geolocation API
- A Celsius/Fahrenheit toggle that re-renders existing data without refetching
- Local persistence of the last searched city
- A weather-based suggestions engine that produces natural guidance for clothing and planning
- Honest error handling for empty input, city not found, rate limiting, network issues, and server failures

## Project structure

- server/server.js – Express app and API routes
- server/weatherApi.js – OpenWeatherMap proxy helpers and error handling
- server/suggestions.js – Weather-based suggestions engine
- public/index.html – App shell and content structure
- public/styles.css – Visual design and responsive layout
- public/app.js – Frontend logic, search flow, and rendering

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file from the example and add your OpenWeatherMap API key.
   - Windows (PowerShell / cmd):

     ```powershell
     copy .env.example .env
     notepad .env    # then paste your OPENWEATHER_API_KEY value and save
     ```

   - macOS / Linux:

     ```bash
     cp .env.example .env
     nano .env       # or use your preferred editor
     ```

   In ` .env` set `OPENWEATHER_API_KEY` to your key. The repository already ignores ` .env` so your secret will not be committed.

3. Start the app:

   ```bash
   npm start
   ```

4. Open the app in your browser. By default the server listens on the port in ` .env` (e.g. `3001`):

   http://localhost:3001

## Notes

- The app uses the free OpenWeatherMap endpoints and expects a valid API key.
- The UI is intentionally focused on weather content and helpful suggestions rather than unrelated features.

## Deploying to Render (recommended)

This project is ready to deploy to Render with minimal steps. Render will build the repo, install dependencies, and run the `web` command from the `Procfile`.

Steps to deploy:

1. Go to https://render.com and sign in (you can use GitHub to connect).
2. Create a new **Web Service** and connect the GitHub repository for this project.
3. For build and start commands, use the defaults (`npm install` / `npm start`). Render will also honor the `Procfile` added to this repository.
4. Add an environment variable named `OPENWEATHER_API_KEY` in the Render dashboard (Environment → Environment Variables) and paste your OpenWeatherMap API key.
5. Deploy the service. After the first deploy completes you'll have a public HTTPS URL (for example `https://your-app.onrender.com`).

Once deployed, update this README to include the public URL under **Demo** or replace the `localhost` link above.

Temporary demo (quick): if you only want a short-lived public URL while you run the app locally, use `ngrok http 3001` and share the generated HTTPS URL. This requires ngrok to be running while demoing.

## Demo

The app is deployed and available at:

https://weatherforecastapplication.onrender.com

The `/health` endpoint is available for quick checks:

https://weatherforecastapplication.onrender.com/health
