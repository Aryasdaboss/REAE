/**
 * NLP Parser Tests
 * Phase 2 — Engines
 *
 * Pure function — no Supabase calls, safe to run anytime.
 * All date parsing uses a fixed reference date: 2026-04-02 (Thursday).
 */

import { parseDate } from '../../services/nlpParser';

// Fixed reference date so results are deterministic
const TODAY = new Date('2026-04-02T12:00:00Z');

describe('NLP Parser — absolute dates', () => {
  it('parses "April 10" as April 10 2026', () => {
    const result = parseDate('submit report April 10', TODAY);
    expect(result).not.toBeNull();
    expect(result!.getMonth()).toBe(3); // April = month 3 (0-indexed)
    expect(result!.getDate()).toBe(10);
  });

  it('parses "2026-05-01" ISO date format', () => {
    const result = parseDate('book flights 2026-05-01', TODAY);
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(4); // May
    expect(result!.getDate()).toBe(1);
  });
});

describe('NLP Parser — relative dates', () => {
  it('parses "tomorrow"', () => {
    const result = parseDate('call dentist tomorrow', TODAY);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(3); // April 3
  });

  it('parses "today"', () => {
    const result = parseDate('finish slides today', TODAY);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(2); // April 2
  });

  it('parses "next Friday"', () => {
    const result = parseDate('team lunch next Friday', TODAY);
    expect(result).not.toBeNull();
    expect(result!.getDay()).toBe(5); // Friday
  });

  it('parses "in 3 days"', () => {
    const result = parseDate('review PR in 3 days', TODAY);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(5); // April 5
  });

  it('parses "next week"', () => {
    const result = parseDate('prepare agenda next week', TODAY);
    expect(result).not.toBeNull();
    // Should be at least 5 days away
    const diffDays = (result!.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(5);
  });
});

describe('NLP Parser — no date in input', () => {
  it('returns null when no date is present', () => {
    const result = parseDate('buy groceries', TODAY);
    expect(result).toBeNull();
  });

  it('returns null for an empty string', () => {
    const result = parseDate('', TODAY);
    expect(result).toBeNull();
  });

  it('returns null for a string with only importance words', () => {
    const result = parseDate('urgent critical task', TODAY);
    expect(result).toBeNull();
  });
});

describe('NLP Parser — date embedded in task title', () => {
  it('extracts date from a full natural language task description', () => {
    const result = parseDate('Call the dentist tomorrow and confirm appointment', TODAY);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(3);
  });

  it('handles mixed case date words', () => {
    const result = parseDate('Meeting TOMORROW morning', TODAY);
    expect(result).not.toBeNull();
  });
});
