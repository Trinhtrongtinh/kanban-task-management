import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ length: 50 })
  username: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
    name: 'auth_provider',
  })
  authProvider: AuthProvider;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.FREE,
    name: 'plan_type',
  })
  planType: PlanType;

  @Column({ type: 'timestamp', nullable: true, name: 'expired_at' })
  expiredAt: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'stripe_customer_id',
  })
  stripeCustomerId: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true, name: 'notify_due_date_email' })
  notifyDueDateEmail: boolean;

  @Column({ type: 'boolean', default: true, name: 'notify_mention_email' })
  notifyMentionEmail: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'reset_password_token_hash',
  })
  @Exclude()
  resetPasswordTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'reset_password_expires_at' })
  resetPasswordExpiresAt: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'refresh_token_hash',
  })
  @Exclude()
  refreshTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'refresh_token_expires_at' })
  refreshTokenExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
