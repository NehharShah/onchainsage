// badges/badge.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const BadgeRequirement = (opts: {
  badgeIds?: number[];
  minRarity?: number;
}) => SetMetadata('badge_requirement', opts);
