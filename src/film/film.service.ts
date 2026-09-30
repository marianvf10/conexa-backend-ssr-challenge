import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { HttpClient } from '@nestjs/http-client';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Film } from './entities/film.entity';

type SwapiFilm = Omit<Film, 'id' | 'swapiId' | 'url'> & { url: string };

interface SwapiPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable()
export class FilmService {
  constructor(
    @InjectRepository(Film)
    private readonly filmRepository: Repository<Film>,
    private readonly http: HttpClient,
  ) {}
  async create(createFilmDto: CreateFilmDto) {
    const now = new Date().toISOString();
    const newFilm = this.filmRepository.create({
      swapiId: null,
      url: null,
      created: now,
      edited: now,
      ...createFilmDto,
    });
    await this.filmRepository.save(newFilm);
    return newFilm;
  }

  async findOne(id: string) {
    return await this.filmRepository.findOneBy({ id });
  }

  async findAll(): Promise<any> {
    return await this.filmRepository.find();
  }

  async update(id: string, updateFilmDto: UpdateFilmDto) {
    const { affected } = await this.filmRepository.update(
      { id },
      { ...updateFilmDto, edited: new Date().toISOString() },
    );
    if (!affected) throw new NotFoundException(`Film ${id} not found`);

    return await this.findOne(id);
  }

  async remove(id: string) {
    return await this.filmRepository.delete({ id });
  }

  async sincronize(): Promise<{ synced: number }> {
    const films: SwapiFilm[] = [];
    let path: string | null = '/films/';

    while (path) {
      const { data } = await this.http.get<SwapiPage<SwapiFilm>>(path);
      films.push(...data.results);
      path = data.next;
    }

    if (films.length === 0) return { synced: 0 };

    await this.filmRepository.upsert(
      films.map(({ url, ...film }) => ({
        ...film,
        url,
        // el id de SWAPI solo viene en la url: .../films/1/ -> 1
        swapiId: Number(url.split('/').filter(Boolean).pop()),
      })),
      ['swapiId'],
    );

    return { synced: films.length };
  }
}
