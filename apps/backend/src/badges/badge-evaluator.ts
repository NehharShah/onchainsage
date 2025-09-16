// badges/badge-evaluator.ts
import { IMetricsService } from './interfaces/metrics.interface';
import { Badge } from './badge.entity';

/**
 * Evaluate badge requirements for a single user.
 * Returns true if requirements are satisfied.
 *
 * Requirements format (JSON):
 * { "type": "accuracy", "threshold": 0.9 }
 * { "type": "calls", "threshold": 1000 }
 * { "type": "community", "threshold": 50 }
 * { "type": "milestone", "days": 365 }
 *
 * Extend this function to support more complex rules or boolean logic.
 */
export async function evaluateBadgeForUser(
  badge: Badge,
  userId: number,
  metrics: IMetricsService,
): Promise<boolean> {
  let req: any;
  try {
    req = JSON.parse(badge.requirements);
  } catch (e) {
    // invalid requirements -> fail-safe: do not assign
    return false;
  }

  const t = req.type?.toLowerCase();

  switch (t) {
    case 'accuracy': {
      const threshold = Number(req.threshold ?? 0);
      const accuracy = await metrics.getAccuracy(userId);
      return accuracy >= threshold;
    }
    case 'calls': {
      const threshold = Number(req.threshold ?? 0);
      const calls = await metrics.getCallCount(userId);
      return calls >= threshold;
    }
    case 'community': {
      const threshold = Number(req.threshold ?? 0);
      const score = await metrics.getCommunityScore(userId);
      return score >= threshold;
    }
    case 'milestone': {
      const days = Number(req.days ?? 0);
      const age = await metrics.getAccountAgeDays(userId);
      return age >= days;
    }
    case 'custom': {
      // For custom, expect an evaluator callback in the app to be used instead of this generic evaluator.
      // Here we default to false.
      return false;
    }
    default:
      // Unknown requirement type: safe default
      return false;
  }
}
