/**
 * Filmtrace Analytics & Telemetry Engine
 * Privacy-friendly, zero-dependency event tracking with GA4 forwarding and local aggregation
 */

export interface AnalyticsEvent {
  event: string;
  timestamp: string;
  properties?: Record<string, any>;
}

export interface FunnelMetrics {
  pageViews: number;
  gameStarts: number;
  firstHopCount: number;
  gameCompletions: number;
  shares: number;
  startToCompleteRate: number; // percentage
  startToShareRate: number;     // percentage
  avgSolveTimeSec: number;
  avgClicks: number;
}

const STORAGE_EVENTS_KEY = 'filmtrace_analytics_events';
const STORAGE_SUMMARY_KEY = 'filmtrace_analytics_summary';

interface AnalyticsSummaryStore {
  totalPageViews: number;
  viewsByScreen: Record<string, number>;
  totalGameStarts: number;
  totalGameCompletions: number;
  totalHopsMade: number;
  totalShares: number;
  totalPuzzlesCreated: number;
  solveTimes: number[];
  solveClicks: number[];
}

function getInitialSummary(): AnalyticsSummaryStore {
  return {
    totalPageViews: 0,
    viewsByScreen: {},
    totalGameStarts: 0,
    totalGameCompletions: 0,
    totalHopsMade: 0,
    totalShares: 0,
    totalPuzzlesCreated: 0,
    solveTimes: [],
    solveClicks: [],
  };
}

/**
 * Log an event to local storage and forward to Google Analytics / Plausible if available
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;

  const eventPayload: AnalyticsEvent = {
    event: eventName,
    timestamp: new Date().toISOString(),
    properties,
  };

  try {
    // 1. Append to recent events ring buffer (up to 200 items)
    const stored = localStorage.getItem(STORAGE_EVENTS_KEY);
    const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
    events.push(eventPayload);
    if (events.length > 200) events.shift();
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));

    // 2. Update aggregated metrics summary
    const summaryRaw = localStorage.getItem(STORAGE_SUMMARY_KEY);
    const summary: AnalyticsSummaryStore = summaryRaw ? JSON.parse(summaryRaw) : getInitialSummary();

    if (eventName === 'page_view') {
      summary.totalPageViews = (summary.totalPageViews || 0) + 1;
      const screen = properties.screen || 'unknown';
      summary.viewsByScreen[screen] = (summary.viewsByScreen[screen] || 0) + 1;
    } else if (eventName === 'game_start') {
      summary.totalGameStarts = (summary.totalGameStarts || 0) + 1;
    } else if (eventName === 'game_hop') {
      summary.totalHopsMade = (summary.totalHopsMade || 0) + 1;
    } else if (eventName === 'game_complete') {
      summary.totalGameCompletions = (summary.totalGameCompletions || 0) + 1;
      if (typeof properties.time_seconds === 'number') {
        summary.solveTimes.push(properties.time_seconds);
        if (summary.solveTimes.length > 100) summary.solveTimes.shift();
      }
      if (typeof properties.clicks === 'number') {
        summary.solveClicks.push(properties.clicks);
        if (summary.solveClicks.length > 100) summary.solveClicks.shift();
      }
    } else if (eventName === 'share_result') {
      summary.totalShares = (summary.totalShares || 0) + 1;
    } else if (eventName === 'puzzle_created') {
      summary.totalPuzzlesCreated = (summary.totalPuzzlesCreated || 0) + 1;
    }

    localStorage.setItem(STORAGE_SUMMARY_KEY, JSON.stringify(summary));
  } catch (err) {
    console.debug('Analytics storage error:', err);
  }

  // 3. Forward to GA4 if window.gtag exists
  if (typeof (window as any).gtag === 'function') {
    try {
      (window as any).gtag('event', eventName, properties);
    } catch (_) {}
  }

  // 4. Custom developer hook / console debug
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Filmtrace Analytics] ${eventName}`, properties);
  }
}

/**
 * Log a page view event
 */
export function trackPageView(screenName: string, extraProps: Record<string, any> = {}): void {
  trackEvent('page_view', {
    screen: screenName,
    url: typeof window !== 'undefined' ? window.location.href : '',
    ...extraProps,
  });
}

/**
 * Get aggregated funnel and engagement analytics summary
 */
export function getFunnelMetrics(): FunnelMetrics {
  if (typeof window === 'undefined') {
    return {
      pageViews: 0,
      gameStarts: 0,
      firstHopCount: 0,
      gameCompletions: 0,
      shares: 0,
      startToCompleteRate: 0,
      startToShareRate: 0,
      avgSolveTimeSec: 0,
      avgClicks: 0,
    };
  }

  try {
    const summaryRaw = localStorage.getItem(STORAGE_SUMMARY_KEY);
    const summary: AnalyticsSummaryStore = summaryRaw ? JSON.parse(summaryRaw) : getInitialSummary();

    const starts = summary.totalGameStarts || 0;
    const completions = summary.totalGameCompletions || 0;
    const shares = summary.totalShares || 0;

    const startToCompleteRate = starts > 0 ? Math.round((completions / starts) * 100) : 0;
    const startToShareRate = completions > 0 ? Math.round((shares / completions) * 100) : 0;

    const avgSolveTimeSec = summary.solveTimes.length > 0
      ? Math.round(summary.solveTimes.reduce((a, b) => a + b, 0) / summary.solveTimes.length)
      : 0;

    const avgClicks = summary.solveClicks.length > 0
      ? Math.round(summary.solveClicks.reduce((a, b) => a + b, 0) / summary.solveClicks.length)
      : 0;

    return {
      pageViews: summary.totalPageViews || 0,
      gameStarts: starts,
      firstHopCount: summary.totalHopsMade || 0,
      gameCompletions: completions,
      shares,
      startToCompleteRate,
      startToShareRate,
      avgSolveTimeSec,
      avgClicks,
    };
  } catch {
    return {
      pageViews: 0,
      gameStarts: 0,
      firstHopCount: 0,
      gameCompletions: 0,
      shares: 0,
      startToCompleteRate: 0,
      startToShareRate: 0,
      avgSolveTimeSec: 0,
      avgClicks: 0,
    };
  }
}
