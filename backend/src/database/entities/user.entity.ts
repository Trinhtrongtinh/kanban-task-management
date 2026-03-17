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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
