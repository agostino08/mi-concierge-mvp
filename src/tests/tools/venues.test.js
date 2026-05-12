import { describe, it, expect } from 'vitest';
import { parseVenuesData } from '../../../api/tools/venues.js';

describe('parseVenuesData', () => {
  const mockResults = [
    { name: 'Bar Marsella', rating: 4.5, formatted_address: 'Carrer dels Escudellers, 53', price_level: 1, business_status: 'OPERATIONAL' },
    { name: 'Old Closed Bar', rating: 3.0, formatted_address: 'Some Street', price_level: 1, business_status: 'CLOSED_PERMANENTLY' },
    { name: 'Paradiso', rating: 4.8, formatted_address: 'Carrer de Rera Palau, 4', price_level: 3, business_status: 'OPERATIONAL' },
  ];

  it('filters out permanently closed venues', () => {
    const result = parseVenuesData({ results: mockResults });
    expect(result.every(v => v.name !== 'Old Closed Bar')).toBe(true);
  });

  it('returns name, rating string, address, and price label', () => {
    const result = parseVenuesData({ results: [mockResults[0]] });
    expect(result[0].name).toBe('Bar Marsella');
    expect(result[0].rating).toBe('4.5/5');
    expect(result[0].address).toBe('Carrer dels Escudellers, 53');
    expect(result[0].price).toBe('Budget-friendly');
  });

  it('maps price_level 3 to "Expensive"', () => {
    const result = parseVenuesData({ results: [mockResults[2]] });
    expect(result[0].price).toBe('Expensive');
  });

  it('handles missing rating', () => {
    const data = { results: [{ name: 'X', business_status: 'OPERATIONAL' }] };
    expect(parseVenuesData(data)[0].rating).toBe('No rating');
  });

  it('returns empty array when results is empty', () => {
    expect(parseVenuesData({ results: [] })).toEqual([]);
  });

  it('limits to max 5 results', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      name: `Venue ${i}`, rating: 4.0, business_status: 'OPERATIONAL', price_level: 1,
    }));
    expect(parseVenuesData({ results: many })).toHaveLength(5);
  });
});
