// badges/dto/assign-badge.dto.ts
import { IsInt } from 'class-validator';

export class AssignBadgeDto {
  @IsInt()
  user_id!: number;

  @IsInt()
  badge_id!: number;
}
