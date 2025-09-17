// badges/badge.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { BadgeService } from './badge.service';
import { Reflector } from '@nestjs/core';

/**
 * Use this guard in controllers to require badges.
 *
 * Example usage:
 * @UseGuards(BadgeGuard)
 * @BadgeRequirement({ minRarity: 2 })
 * @Get('special')
 */
@Injectable()
export class BadgeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private badgeService: BadgeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user; // assumes authentication middleware sets req.user
    if (!user) throw new ForbiddenException('User not authenticated');

    const requirement =
      this.reflector.get<any>('badge_requirement', context.getHandler()) ||
      this.reflector.get<any>('badge_requirement', context.getClass());

    if (!requirement) return true; // no requirement -> allow

    const ok = await this.badgeService.userHasPrivilege(user.id, requirement);
    if (!ok)
      throw new ForbiddenException('Badge privilege requirement not met');
    return true;
  }
}
