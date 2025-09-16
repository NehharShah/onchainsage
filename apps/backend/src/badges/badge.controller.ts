// badges/badge.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { BadgeService } from './badge.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { AssignBadgeDto } from './dto/assign-badge.dto';

@Controller('badges')
export class BadgeController {
  constructor(private readonly svc: BadgeService) {}

  @Post()
  async create(@Body() dto: CreateBadgeDto) {
    return this.svc.createBadge(dto);
  }

  @Get()
  async list() {
    return this.svc.listBadges();
  }

  @Post('assign')
  async assign(@Body() dto: AssignBadgeDto) {
    return this.svc.assignBadge(dto);
  }

  @Post('revoke')
  async revoke(@Body() dto: AssignBadgeDto) {
    return this.svc.revokeBadge(dto.user_id, dto.badge_id);
  }

  @Get('user/:userId')
  async userBadges(@Param('userId', ParseIntPipe) userId: number) {
    return this.svc.getBadgesForUser(userId);
  }

  @Post('evaluate/:userId')
  async evaluate(@Param('userId', ParseIntPipe) userId: number) {
    return this.svc.checkAndAssignBadgesForUser(userId);
  }

  @Get('verify/:userId/:badgeId')
  async verify(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('badgeId', ParseIntPipe) badgeId: number,
  ) {
    const ok = await this.svc.verifyUserHasBadge(userId, badgeId);
    return { userId, badgeId, hasBadge: ok };
  }

  // Example endpoint to check privileges
  @Get('privilege/:userId')
  async privilege(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('minRarity') minRarity?: string,
    @Query('badgeIds') badgeIdsCsv?: string,
  ) {
    const opts: any = {};
    if (minRarity) opts.minRarity = Number(minRarity);
    if (badgeIdsCsv)
      opts.badgeIds = badgeIdsCsv.split(',').map((s) => Number(s.trim()));
    const ok = await this.svc.userHasPrivilege(userId, opts);
    return { userId, hasPrivilege: ok };
  }
}
