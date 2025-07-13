require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import the cors middleware

const app = express();
const port = process.env.PORT || 3000; // Use port 3000, or environment variable if set

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// --- Middleware ---
// Enable CORS for all routes - essential for frontend to communicate with backend
app.use(cors());
// Parse JSON request bodies (not strictly needed for this simple GET endpoint, but good practice)
app.use(express.json());

// --- API Route to fetch weather data ---
// API Route to fetch weather data
app.get('/api/weather', async (req, res) => {
    const { city, lat, lon } = req.query; // Get city OR lat/lon from query parameters

    let queryParam;
    let urlEndpoint;

    if (city) {
        queryParam = `q=${encodeURIComponent(city)}`;
        urlEndpoint = 'weather'; // For current weather
        console.log(`Backend: Fetching weather for city: ${city}`);
    } else if (lat && lon) {
        queryParam = `lat=${lat}&lon=${lon}`;
        urlEndpoint = 'weather'; // For current weather
        console.log(`Backend: Fetching weather for lat: ${lat}, lon: ${lon}`);
    } else {
        return res.status(400).json({ error: 'City or latitude/longitude parameters are required' });
    }

    if (!OPENWEATHER_API_KEY) {
        console.error('OPENWEATHER_API_KEY is not set in .env file!');
        return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
        // 1. Fetch current weather data
        const currentWeatherUrl = `${OPENWEATHER_BASE_URL}/${urlEndpoint}?${queryParam}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const currentWeatherResponse = await axios.get(currentWeatherUrl);
        const currentWeatherData = currentWeatherResponse.data;

        // 2. Fetch 5-day / 3-hour forecast data
        // Note: OpenWeatherMap 'forecast' API also accepts lat/lon
        const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?${queryParam}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const forecastResponse = await axios.get(forecastUrl);
        const forecastData = forecastResponse.data;

        res.json({
            current: currentWeatherData,
            forecast: forecastData,
        });

    } catch (error) {
        console.error('Error fetching data from OpenWeatherMap:', error.message);
        if (error.response) {
            console.error('OpenWeatherMap API Response Error:', error.response.data);
            res.status(error.response.status).json({
                error: error.response.data.message || 'Error from external weather service',
                code: error.response.status
            });
        } else if (error.request) {
            console.error('No response received from OpenWeatherMap:', error.request);
            res.status(500).json({ error: 'No response from external weather service' });
        } else {
            console.error('Error setting up OpenWeatherMap request:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log(`OpenWeatherMap API Key Loaded: ${OPENWEATHER_API_KEY ? 'Yes' : 'No'}`);
});