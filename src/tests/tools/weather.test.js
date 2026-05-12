import { describe, it, expect } from 'vitest';
import { parseWeatherData } from '../../../api/tools/weather.js';

describe('parseWeatherData', () => {
  const mockData = {
    current: { temperature_2m: 22.4, weathercode: 1, windspeed_10m: 10 },
    daily: {
      time: ['2026-05-03', '2026-05-04', '2026-05-05'],
      weathercode: [0, 61, 2],
      temperature_2m_max: [25, 20, 23],
      temperature_2m_min: [18, 15, 17],
    },
  };

  it('includes current temperature rounded to integer', () => {
    expect(parseWeatherData(mockData)).toContain('22°C');
  });

  it('maps weathercode 1 to "mainly clear"', () => {
    expect(parseWeatherData(mockData)).toContain('mainly clear');
  });

  it('includes all three forecast dates', () => {
    const result = parseWeatherData(mockData);
    expect(result).toContain('2026-05-03');
    expect(result).toContain('2026-05-04');
    expect(result).toContain('2026-05-05');
  });

  it('maps weathercode 61 to "light rain"', () => {
    expect(parseWeatherData(mockData)).toContain('light rain');
  });

  it('returns fallback string for unknown weathercode', () => {
    const data = { ...mockData, current: { temperature_2m: 20, weathercode: 999, windspeed_10m: 5 } };
    expect(parseWeatherData(data)).toContain('20°C');
  });
});
