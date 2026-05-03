const WMO = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'icy fog',
  51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  56: 'freezing drizzle', 57: 'heavy freezing drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain',
  66: 'freezing rain', 67: 'heavy freezing rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow',
  77: 'snow grains',
  80: 'showers', 81: 'moderate showers', 82: 'heavy showers',
  85: 'light snow showers', 86: 'heavy snow showers',
  95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'thunderstorm with heavy hail',
};

export function parseWeatherData(data) {
  const c = data.current;
  const d = data.daily;
  const current = `${Math.round(c.temperature_2m)}°C, ${WMO[c.weathercode] ?? 'unknown conditions'}`;
  const forecast = d.time.map((date, i) => {
    const hi = Math.round(d.temperature_2m_max[i]);
    const lo = Math.round(d.temperature_2m_min[i]);
    return `${date}: ${hi}°C/${lo}°C, ${WMO[d.weathercode[i]] ?? 'unknown'}`;
  }).join(' | ');
  return `Now: ${current}. Forecast: ${forecast}`;
}

export async function getWeather({ city }) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.results?.length) return `Weather data unavailable for ${city}.`;
    const { latitude, longitude } = geoData.results[0];

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weathercode,windspeed_10m` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`
    );
    const forecastData = await forecastRes.json();
    return parseWeatherData(forecastData);
  } catch (e) {
    return `Weather data unavailable: ${e.message}`;
  }
}
