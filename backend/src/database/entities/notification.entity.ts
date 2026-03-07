import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Card } from './card.entity';

export enum NotificationType {
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  CARD_ASSIGNED = 'CARD_ASSIGNED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  CARD_MOVED = 'CARD_MOVED',
  MENTION = 'MENTION',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'card_id', nullable: true })
  cardId: string | null;

  @ManyToOne(() => Card, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.DEADLINE_REMINDER,
  })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  link: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
