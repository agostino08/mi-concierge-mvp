import { describe, it, expect } from 'vitest';
import { parseEventsData } from '../../../api/tools/events.js';

describe('parseEventsData', () => {
  it('returns no-events message when _embedded is missing', () => {
    expect(parseEventsData({})).toBe('No events found for this period.');
  });

  it('returns no-events message when events array is empty', () => {
    expect(parseEventsData({ _embedded: { events: [] } })).toBe('No events found for this period.');
  });

  it('formats event name, date, and venue', () => {
    const data = {
      _embedded: {
        events: [{
          name: 'Jazz Night',
          dates: { start: { localDate: '2026-05-04' } },
          _embedded: { venues: [{ name: 'Palau de la Música' }] },
        }],
      },
    };
    const result = parseEventsData(data);
    expect(result).toContain('Jazz Night');
    expect(result).toContain('2026-05-04');
    expect(result).toContain('Palau de la Música');
  });

  it('handles missing venue gracefully', () => {
    const data = {
      _embedded: {
        events: [{ name: 'Concert', dates: { start: { localDate: '2026-05-04' } } }],
      },
    };
    expect(parseEventsData(data)).toContain('Concert');
    expect(parseEventsData(data)).toContain('venue TBC');
  });

  it('formats multiple events as separate lines', () => {
    const makeEvent = (name) => ({ name, dates: { start: { localDate: '2026-05-04' } } });
    const data = { _embedded: { events: [makeEvent('A'), makeEvent('B')] } };
    const lines = parseEventsData(data).split('\n');
    expect(lines).toHaveLength(2);
  });
});
