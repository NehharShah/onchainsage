// badges/interfaces/metrics.interface.ts
/**
 * Simple interface the service uses to get user metrics.
 * Implement this in your app to provide accuracy, call counts, community stats, etc.
 */
export interface IMetricsService {
  getAccuracy(userId: number): Promise<number>; // 0..1
  getCallCount(userId: number): Promise<number>;
  getCommunityScore(userId: number): Promise<number>; // e.g. posts + likes
  getAccountAgeDays(userId: number): Promise<number>;
}
