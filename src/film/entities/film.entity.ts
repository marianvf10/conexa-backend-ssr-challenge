import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Film {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column({ type: 'int', unique: true, nullable: true })
  swapiId: number | null;
  @Column('int')
  episode_id: number;
  @Column('text')
  title: string;

  @Column('text')
  opening_crawl: string;

  @Column('text')
  director: string;

  @Column('text')
  producer: string;

  @Column('text')
  release_date: string;

  @Column('text', { array: true })
  characters: string[];

  @Column('text', { array: true })
  planets: string[];

  @Column('text', { array: true })
  starships: string[];

  @Column('text', { array: true })
  vehicles: string[];

  @Column('text', { array: true })
  species: string[];

  @Column('text')
  created: string;

  @Column('text')
  edited: string;

  @Column('text', { nullable: true })
  url: string | null;
}
