import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Board } from './board.entity';
import { Card } from './card.entity';

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

  @Column({ name: 'board_id' })
  boardId: string;

  @ManyToOne(() => Board, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @Column({ name: 'card_id', nullable: true })
  cardId: string | null;

  @ManyToOne(() => Card, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'card_id' })
  card: Card | null;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
