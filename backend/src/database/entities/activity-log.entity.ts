import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Board } from './board.entity';
import { Card } from './card.entity';
import { ActivityAction } from '../../common/enums';

@Index('IDX_ACTIVITY_LOG_BOARD_CREATED_AT', ['boardId', 'createdAt'])
@Index('IDX_ACTIVITY_LOG_USER_CREATED_AT', ['userId', 'createdAt'])
@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'board_id', nullable: true })
  boardId: string | null;

  @ManyToOne(() => Board, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'board_id' })
  board: Board | null;

  @Column({ name: 'card_id', nullable: true })
  cardId: string | null;

  @ManyToOne(() => Card, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'card_id' })
  card: Card | null;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  action: ActivityAction;

  @Column({ name: 'entity_title', type: 'varchar', length: 255 })
  entityTitle: string;

  @Column({ type: 'json', nullable: true })
  details: Record<string, unknown> | null;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
