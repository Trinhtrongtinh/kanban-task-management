import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Workspace } from './workspace.entity';
import { List } from './list.entity';
import { Label } from './label.entity';

export enum BoardVisibility {
  PRIVATE = 'Private',
  WORKSPACE = 'Workspace',
  PUBLIC = 'Public',
}

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.boards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true, name: 'background_url' })
  backgroundUrl: string | null;

  @Column({
    type: 'enum',
    enum: BoardVisibility,
    default: BoardVisibility.PRIVATE,
  })
  visibility: BoardVisibility;

  @Column({ length: 100, unique: true })
  slug: string;

  @OneToMany(() => List, (list) => list.board)
  lists: List[];

  @OneToMany(() => Label, (label) => label.board)
  labels: Label[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
