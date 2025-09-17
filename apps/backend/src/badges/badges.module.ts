// badges/badge.module.ts
import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { BadgeService } from './badge.service';
import { BadgeController } from './badge.controller';
import { BadgeGuard } from './badge.guard';

// Replace with your actual User entity import
import { User } from '../users/user.entity';

// Provide a token IMetricsService — implement and register this provider in your app module
import { IMetricsService } from './interfaces/metrics.interface';

const MetricsServiceToken = 'IMetricsService';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge, User])],
  controllers: [BadgeController],
  providers: [
    BadgeService,
    BadgeGuard,
    // IMetricsService is expected to be provided by the application.
    // You can register a concrete provider in AppModule like:
    // { provide: 'IMetricsService', useClass: AppMetricsService }
    // For safety here, we add a placeholder provider that throws if used without a real implementation.
    {
      provide: MetricsServiceToken,
      useFactory: () => {
        throw new Error(
          'IMetricsService not implemented. Provide a concrete implementation in your AppModule.',
        );
      },
    } as Provider,
  ],
  exports: [BadgeService, BadgeGuard],
})
export class BadgeModule {}
