// badges/dto/create-badge.dto.ts
import { IsEnum, IsString, IsOptional, IsInt, Min } from "class-validator";
import { BadgeType } from "../badge-type.enum";

export class CreateBadgeDto {
  @IsEnum(BadgeType)
  badge_type!: BadgeType;

  @IsString()
  requirements!: string; // JSON string describing criteria

  @IsInt()
  @Min(0)
  rarity_level!: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
