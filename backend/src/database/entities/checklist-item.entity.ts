import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Checklist } from './checklist.entity';

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'checklist_id' })
  checklistId: string;

  @ManyToOne(() => Checklist, (checklist) => checklist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checklist_id' })
  checklist: Checklist;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false, name: 'is_done' })
  isDone: boolean;

  @Column({ type: 'int' })
  position: number;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
