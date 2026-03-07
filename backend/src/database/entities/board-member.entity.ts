import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Board } from './board.entity';
import { BoardRole } from '../../common/enums';

@Entity('board_members')
@Unique(['boardId', 'userId'])
export class BoardMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'board_id' })
  boardId: string;

  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: BoardRole,
    default: BoardRole.VIEWER,
  })
  role: BoardRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
