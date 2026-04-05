import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { List } from './list.entity';
import { Label } from './label.entity';
import { Checklist } from './checklist.entity';
import { Attachment } from './attachment.entity';
import { Comment } from './comment.entity';
import { User } from './user.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'list_id' })
  listId: string;

  @ManyToOne(() => List, (list) => list.cards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'list_id' })
  list: List;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'card_members',
    joinColumn: { name: 'card_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'double' })
  position: number;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date | null;

  @Column({ type: 'boolean', default: false, name: 'is_reminded' })
  isReminded: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_archived' })
  isArchived: boolean;

  @ManyToMany(() => Label, (label) => label.cards)
  @JoinTable({
    name: 'card_labels',
    joinColumn: { name: 'card_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'label_id', referencedColumnName: 'id' },
  })
  labels: Label[];

  @OneToMany(() => Checklist, (checklist) => checklist.card, {
    cascade: true,
  })
  checklists: Checklist[];

  @OneToMany(() => Attachment, (attachment) => attachment.card, {
    cascade: true,
  })
  attachments: Attachment[];

  @OneToMany(() => Comment, (comment) => comment.card, {
    cascade: true,
  })
  comments: Comment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
