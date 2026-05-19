import { describe, it, expect, vi, beforeEach } from 'vitest'
import { urgencyLevel, formatInterval, daysSince } from '@/lib/utils'

const NOW = new Date('2026-05-18T12:00:00Z')

beforeEach(() => {
  vi.setSystemTime(NOW)
})

describe('urgencyLevel', () => {
  it('returns none when no last execution', () => {
    expect(urgencyLevel(null, 30)).toBe('none')
  })

  it('returns ok when no interval set', () => {
    expect(urgencyLevel('2026-05-01T00:00:00Z', null)).toBe('ok')
  })

  it('returns ok when under 75% of interval', () => {
    // 10 days ago, interval 30 days → 33% → ok
    expect(urgencyLevel('2026-05-08T00:00:00Z', 30)).toBe('ok')
  })

  it('returns warning when between 75% and 100% of interval', () => {
    // 25 days ago, interval 30 days → 83% → warning
    expect(urgencyLevel('2026-04-23T00:00:00Z', 30)).toBe('warning')
  })

  it('returns overdue when over interval', () => {
    // 35 days ago, interval 30 days → 117% → overdue
    expect(urgencyLevel('2026-04-13T00:00:00Z', 30)).toBe('overdue')
  })
})

describe('formatInterval', () => {
  it('formats single day', () => {
    expect(formatInterval(1)).toBe('cada día')
  })

  it('formats days', () => {
    expect(formatInterval(5)).toBe('cada 5 días')
  })

  it('formats weeks', () => {
    expect(formatInterval(7)).toBe('cada semana')
    expect(formatInterval(14)).toBe('cada 2 semanas')
  })

  it('formats months', () => {
    expect(formatInterval(30)).toBe('cada 1 meses')
  })
})

describe('daysSince', () => {
  it('returns correct number of days', () => {
    expect(daysSince('2026-05-13T00:00:00Z')).toBe(5)
  })

  it('returns 0 for today', () => {
    expect(daysSince('2026-05-18T00:00:00Z')).toBe(0)
  })
})
