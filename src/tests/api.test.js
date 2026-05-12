import { describe, it, expect } from 'vitest';
import { parseSseMessages } from '../services/api.js';

describe('parseSseMessages', () => {
  it('parses a single tool_call event', () => {
    const chunk = 'event: tool_call\ndata: {"name":"get_weather","input":{"city":"Barcelona"}}\n\n';
    const result = parseSseMessages(chunk);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ event: 'tool_call', data: { name: 'get_weather', input: { city: 'Barcelona' } } });
  });

  it('parses two events in one chunk', () => {
    const chunk =
      'event: tool_call\ndata: {"name":"get_weather","input":{}}\n\n' +
      'event: tool_result\ndata: {"name":"get_weather","summary":"24°C"}\n\n';
    expect(parseSseMessages(chunk)).toHaveLength(2);
  });

  it('ignores incomplete trailing message', () => {
    const chunk = 'event: content\ndata: {"activities":[],"food":[],"transport":[]}\n\nevent: done\n';
    expect(parseSseMessages(chunk)).toHaveLength(1);
    expect(parseSseMessages(chunk)[0].event).toBe('content');
  });

  it('returns empty array for blank input', () => {
    expect(parseSseMessages('')).toEqual([]);
    expect(parseSseMessages('\n\n')).toEqual([]);
  });

  it('parses done event with empty data', () => {
    const chunk = 'event: done\ndata: {}\n\n';
    const result = parseSseMessages(chunk);
    expect(result[0]).toEqual({ event: 'done', data: {} });
  });

  it('parses error event', () => {
    const chunk = 'event: error\ndata: {"message":"Rate limit exceeded"}\n\n';
    expect(parseSseMessages(chunk)[0].data.message).toBe('Rate limit exceeded');
  });
});
