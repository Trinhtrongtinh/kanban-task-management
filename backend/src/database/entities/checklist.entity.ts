import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Card } from './card.entity';
import { ChecklistItem } from './checklist-item.entity';

@Entity('checklists')
export class Checklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_id' })
  cardId: string;

  @ManyToOne(() => Card, (card) => card.checklists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({ length: 255 })
  title: string;

  @OneToMany(() => ChecklistItem, (item) => item.checklist, {
    cascade: true,
  })
  items: ChecklistItem[];
}
