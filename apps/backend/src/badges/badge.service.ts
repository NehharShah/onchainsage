// badges/badge.service.ts
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { AssignBadgeDto } from './dto/assign-badge.dto';
import { IMetricsService } from './interfaces/metrics.interface';
import { evaluateBadgeForUser } from './badge-evaluator';
import { BadgeType } from './badge-type.enum';

// Replace this with your actual User entity import
import { User } from '../users/user.entity';

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject('IMetricsService') private readonly metrics: IMetricsService,
    private readonly connection: Connection,
  ) {}

  // Create new badge metadata
  async createBadge(dto: CreateBadgeDto): Promise<Badge> {
    const b = this.badgeRepo.create({
      badge_type: dto.badge_type,
      requirements: dto.requirements,
      rarity_level: dto.rarity_level,
      title: dto.title,
      description: dto.description,
    });
    return this.badgeRepo.save(b);
  }

  // List badges
  async listBadges(): Promise<Badge[]> {
    return this.badgeRepo.find();
  }

  // Assign badge manually (idempotent)
  async assignBadge({ user_id, badge_id }: AssignBadgeDto): Promise<UserBadge> {
    const user = await this.userRepo.findOneBy({ id: user_id });
    if (!user) throw new Error('User not found');

    const badge = await this.badgeRepo.findOneBy({ badge_id });
    if (!badge) throw new Error('Badge not found');

    let existing = await this.userBadgeRepo.findOne({
      where: { user_id, badge_id },
    });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        existing.revoked_at = undefined;
        return this.userBadgeRepo.save(existing);
      }
      return existing;
    }

    const ub = this.userBadgeRepo.create({
      user_id,
      badge_id,
      user,
      badge,
      active: true,
    });
    return this.userBadgeRepo.save(ub);
  }

  // Revoke (deactivate) a badge for a user
  async revokeBadge(userId: number, badgeId: number, reason?: string) {
    const ub = await this.userBadgeRepo.findOne({
      where: { user_id: userId, badge_id: badgeId },
    });
    if (!ub) throw new Error('UserBadge not found');
    if (!ub.active) return ub;

    ub.active = false;
    ub.revoked_at = new Date();
    // record reason if you want (add column for reason)
    return this.userBadgeRepo.save(ub);
  }

  // Returns active badges for a user
  async getBadgesForUser(userId: number): Promise<UserBadge[]> {
    return this.userBadgeRepo.find({
      where: { user_id: userId, active: true },
    });
  }

  // Verification function: checks ownership (active) and returns metadata
  async verifyUserHasBadge(userId: number, badgeId: number): Promise<boolean> {
    const ub = await this.userBadgeRepo.findOne({
      where: { user_id: userId, badge_id: badgeId, active: true },
    });
    return !!ub;
  }

  // Core: check all badges and auto-assign those that match criteria for a user
  // This is the function you might call from a cron job or whenever an event occurs
  async checkAndAssignBadgesForUser(
    userId: number,
  ): Promise<{ assigned: number[]; revoked: number[] }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new Error('User not found');

    const badges = await this.badgeRepo.find();
    const assigned: number[] = [];
    const revoked: number[] = [];

    // Use a transaction to avoid race conditions
    await this.connection.transaction(async (manager) => {
      for (const b of badges) {
        const qualifies = await evaluateBadgeForUser(b, userId, this.metrics);

        const existing = await manager
          .getRepository(UserBadge)
          .findOne({ where: { user_id: userId, badge_id: b.badge_id } });

        // Performance-based badges can be revoked if underperformance
        const isPerformance = b.badge_type === BadgeType.PERFORMANCE;

        if (qualifies) {
          if (!existing) {
            const newUb = manager.getRepository(UserBadge).create({
              user_id: userId,
              badge_id: b.badge_id,
              user,
              badge: b,
              active: true,
            });
            await manager.getRepository(UserBadge).save(newUb);
            assigned.push(b.badge_id);
          } else if (!existing.active) {
            existing.active = true;
            existing.revoked_at = undefined;
            await manager.getRepository(UserBadge).save(existing);
            assigned.push(b.badge_id);
          }
        } else {
          if (existing && existing.active && isPerformance) {
            existing.active = false;
            existing.revoked_at = new Date();
            await manager.getRepository(UserBadge).save(existing);
            revoked.push(b.badge_id);
          }
        }
      }
    });

    return { assigned, revoked };
  }

  // Badge-based privilege enforcement helper
  // Example: returns true if user has at least one badge with rarity >= minRarity
  async userHasPrivilege(
    userId: number,
    opts: { badgeIds?: number[]; minRarity?: number } = {},
  ): Promise<boolean> {
    const qb = this.userBadgeRepo
      .createQueryBuilder('ub')
      .innerJoinAndSelect('ub.badge', 'b')
      .where('ub.user_id = :userId', { userId })
      .andWhere('ub.active = true');

    if (opts.badgeIds && opts.badgeIds.length) {
      qb.andWhere('b.badge_id IN (:...badgeIds)', { badgeIds: opts.badgeIds });
    }

    if (typeof opts.minRarity === 'number') {
      qb.andWhere('b.rarity_level >= :minRarity', {
        minRarity: opts.minRarity,
      });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  // Helper: reasonable gas/operation cost note: for any blockchain ops, keep on-chain write operations minimal.
  // This method is synchronous DB operation; if you need on-chain operations, batch them outside this hot path.
}
