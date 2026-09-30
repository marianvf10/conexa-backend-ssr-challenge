import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import {
  HttpClient,
  HttpClientError,
  HttpResponseError,
  HttpTimeoutError,
} from '@nestjs/http-client';
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
  private readonly logger = new Logger(FilmService.name);

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
      ...createFilmDto,
      // las fechas las maneja siempre el servidor
      created: now,
      edited: now,
    });
    await this.filmRepository.save(newFilm);
    return newFilm;
  }

  async findOne(id: string) {
    const film = await this.filmRepository.findOneBy({ id });
    if (!film) throw new NotFoundException(`Film ${id} not found`);

    return film;
  }

  async findAll(): Promise<Film[]> {
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
    const result = await this.filmRepository.delete({ id });
    if (!result.affected) throw new NotFoundException(`Film ${id} not found`);

    return result;
  }

  async sincronize(): Promise<{ synced: number }> {
    const films = await this.fetchSwapiFilms();

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

  // Solo los errores de la API externa se traducen a 502; los de la base siguen su curso
  private async fetchSwapiFilms(): Promise<SwapiFilm[]> {
    const films: SwapiFilm[] = [];
    let path: string | null = '/films/';

    try {
      while (path) {
        const { data } = await this.http.get<SwapiPage<SwapiFilm>>(path);
        films.push(...data.results);
        path = data.next;
      }
    } catch (error) {
      if (!(error instanceof HttpClientError)) throw error;

      this.logger.error(`Star Wars API request failed: ${error.message}`);
      throw new BadGatewayException(this.swapiErrorMessage(error));
    }

    return films;
  }

  private swapiErrorMessage(error: HttpClientError): string {
    if (error instanceof HttpTimeoutError)
      return 'The Star Wars API did not respond in time. Please try again later.';

    if (error instanceof HttpResponseError)
      return `The Star Wars API responded with an error (${error.status}). Please try again later.`;

    return 'Could not reach the Star Wars API. Please try again later.';
  }
}
