// badges/user-badge.entity.ts
import {
 
 
 
 
 
 ,

  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Badge } from './badge.entity';

// NOTE: Adjust import of User entity to your app's user entity
import { User } from '../users/userentity'

@Entity({ name: 'user_badges' })
export class UserBadge {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int' })
  user_id!: number;

  @ManyToOne(() => Badge, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_id' })
  badge!: Badge;

  @Column({ type: 'int' })
  badge_id!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean; // false if revoked

  @CreateDateColumn({ name: 'assigned_at' })
  assigned_at!: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revoked_at?: Date;
}
