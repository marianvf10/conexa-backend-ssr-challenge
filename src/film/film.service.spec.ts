import { BadGatewayException, Logger, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  HttpClient,
  HttpNetworkError,
  HttpResponseError,
  HttpTimeoutError,
} from '@nestjs/http-client';
import { FilmService } from './film.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { Film } from './entities/film.entity';

describe('FilmService', () => {
  const filmRepository = {
    create: jest.fn((data) => ({ ...data })),
    save: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  };
  const http = { get: jest.fn() };

  let service: FilmService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        FilmService,
        { provide: getRepositoryToken(Film), useValue: filmRepository },
        { provide: HttpClient, useValue: http },
      ],
    }).compile();

    service = moduleRef.get(FilmService);
  });

  const filmId = '7f2b0c8e-1f8a-4f3a-9d5e-6f7d4c2b1a00';

  describe('create', () => {
    const dto: CreateFilmDto = {
      episode_id: 4,
      title: 'A New Hope',
      opening_crawl: 'It is a period of civil war...',
      director: 'George Lucas',
      producer: 'Gary Kurtz',
      release_date: '1977-05-25',
      characters: [],
      planets: [],
      starships: [],
      vehicles: [],
      species: [],
    };

    it('guarda la pelicula con swapiId y url en null si no se informan', async () => {
      const film = await service.create(dto);

      expect(filmRepository.save).toHaveBeenCalledWith(film);
      expect(film).toMatchObject({ ...dto, swapiId: null, url: null });
    });

    it('conserva el swapiId y la url si se informan', async () => {
      const film = await service.create({
        ...dto,
        swapiId: 1,
        url: 'https://swapi.dev/api/films/1/',
      });

      expect(film).toMatchObject({
        swapiId: 1,
        url: 'https://swapi.dev/api/films/1/',
      });
    });

    it('asigna created y edited con la fecha actual del servidor', async () => {
      const before = Date.now();

      const film = await service.create(dto);

      expect(film.created).toBe(film.edited);
      expect(new Date(film.created).toISOString()).toBe(film.created);
      expect(new Date(film.created).getTime()).toBeGreaterThanOrEqual(before);
    });

    it('ignora created y edited aunque lleguen en los datos', async () => {
      const tampered = {
        ...dto,
        created: '1999-01-01',
        edited: '1999-01-01',
      } as CreateFilmDto;

      const film = await service.create(tampered);

      expect(film.created).not.toBe('1999-01-01');
      expect(film.edited).not.toBe('1999-01-01');
    });
  });

  describe('findOne', () => {
    it('devuelve la pelicula buscada por id', async () => {
      const film = { id: filmId, title: 'A New Hope' };
      filmRepository.findOneBy.mockResolvedValue(film);

      await expect(service.findOne(filmId)).resolves.toBe(film);
      expect(filmRepository.findOneBy).toHaveBeenCalledWith({ id: filmId });
    });

    it('responde 404 si la pelicula no existe', async () => {
      filmRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(filmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('devuelve todas las peliculas', async () => {
      const films = [{ id: '1' }, { id: '2' }];
      filmRepository.find.mockResolvedValue(films);

      await expect(service.findAll()).resolves.toBe(films);
    });
  });

  describe('update', () => {
    it('actualiza los campos, renueva edited y devuelve la pelicula', async () => {
      const updated = { id: filmId, title: 'Nuevo titulo' };
      filmRepository.update.mockResolvedValue({ affected: 1 });
      filmRepository.findOneBy.mockResolvedValue(updated);

      const result = await service.update(filmId, { title: 'Nuevo titulo' });

      expect(result).toBe(updated);
      const [criteria, changes] = filmRepository.update.mock.calls[0];
      expect(criteria).toEqual({ id: filmId });
      expect(changes.title).toBe('Nuevo titulo');
      expect(new Date(changes.edited).toISOString()).toBe(changes.edited);
      expect(changes).not.toHaveProperty('created');
    });

    it('responde 404 si la pelicula no existe', async () => {
      filmRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.update(filmId, { title: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(filmRepository.findOneBy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina la pelicula por id', async () => {
      const deleteResult = { raw: [], affected: 1 };
      filmRepository.delete.mockResolvedValue(deleteResult);

      await expect(service.remove(filmId)).resolves.toBe(deleteResult);
      expect(filmRepository.delete).toHaveBeenCalledWith({ id: filmId });
    });

    it('responde 404 si la pelicula no existe', async () => {
      filmRepository.delete.mockResolvedValue({ raw: [], affected: 0 });

      await expect(service.remove(filmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('sincronize', () => {
    const swapiFilm = (n: number) => ({
      episode_id: n,
      title: `Film ${n}`,
      opening_crawl: 'x',
      director: 'd',
      producer: 'p',
      release_date: '1977-05-25',
      characters: [],
      planets: [],
      starships: [],
      vehicles: [],
      species: [],
      created: '2014-12-10T14:23:31.880000Z',
      edited: '2014-12-20T19:49:45.256000Z',
      url: `https://swapi.dev/api/films/${n}/`,
    });

    const page = (results: object[], next: string | null = null) => ({
      data: { count: results.length, next, previous: null, results },
    });

    const requestInfo = { method: 'GET', url: 'https://swapi.dev/api/films/' };

    it('guarda las peliculas por swapiId, extraido de la url', async () => {
      http.get.mockResolvedValue(page([swapiFilm(1), swapiFilm(2)]));

      const result = await service.sincronize();

      expect(result).toEqual({ synced: 2 });
      const [rows, conflictColumns] = filmRepository.upsert.mock.calls[0];
      expect(conflictColumns).toEqual(['swapiId']);
      expect(rows.map((row) => row.swapiId)).toEqual([1, 2]);
      expect(rows[0].url).toBe('https://swapi.dev/api/films/1/');
    });

    it('recorre todas las paginas de la API', async () => {
      http.get
        .mockResolvedValueOnce(
          page([swapiFilm(1)], 'https://swapi.dev/api/films/?page=2'),
        )
        .mockResolvedValueOnce(page([swapiFilm(2)]));

      const result = await service.sincronize();

      expect(http.get).toHaveBeenCalledTimes(2);
      expect(http.get).toHaveBeenNthCalledWith(1, '/films/');
      expect(http.get).toHaveBeenNthCalledWith(
        2,
        'https://swapi.dev/api/films/?page=2',
      );
      expect(result).toEqual({ synced: 2 });
    });

    it('no toca la base si la API no devuelve peliculas', async () => {
      http.get.mockResolvedValue(page([]));

      await expect(service.sincronize()).resolves.toEqual({ synced: 0 });
      expect(filmRepository.upsert).not.toHaveBeenCalled();
    });

    describe('cuando la API de Star Wars falla', () => {
      it('responde 502 indicando el codigo si la API devuelve un error', async () => {
        http.get.mockRejectedValue(
          new HttpResponseError({ ...requestInfo, status: 503 }),
        );

        const error = await service.sincronize().catch((e) => e);

        expect(error).toBeInstanceOf(BadGatewayException);
        expect(error.message).toContain('(503)');
      });

      it('responde 502 indicando el tiempo agotado', async () => {
        http.get.mockRejectedValue(
          new HttpTimeoutError({ ...requestInfo, timeoutMs: 5000 }),
        );

        const error = await service.sincronize().catch((e) => e);

        expect(error).toBeInstanceOf(BadGatewayException);
        expect(error.message).toContain('did not respond in time');
      });

      it('responde 502 indicando que no se pudo conectar', async () => {
        http.get.mockRejectedValue(
          new HttpNetworkError({ ...requestInfo, cause: new Error('ECONNREFUSED') }),
        );

        const error = await service.sincronize().catch((e) => e);

        expect(error).toBeInstanceOf(BadGatewayException);
        expect(error.message).toContain('Could not reach');
      });

      it('no guarda nada si una pagina falla a mitad de camino', async () => {
        http.get
          .mockResolvedValueOnce(
            page([swapiFilm(1)], 'https://swapi.dev/api/films/?page=2'),
          )
          .mockRejectedValueOnce(
            new HttpTimeoutError({ ...requestInfo, timeoutMs: 5000 }),
          );

        await expect(service.sincronize()).rejects.toThrow(BadGatewayException);
        expect(filmRepository.upsert).not.toHaveBeenCalled();
      });
    });

    it('no disfraza de 502 los errores que no son de la API externa', async () => {
      http.get.mockRejectedValue(new TypeError('bug inesperado'));

      await expect(service.sincronize()).rejects.toThrow(TypeError);
    });

    it('no disfraza de 502 un error de la base al guardar', async () => {
      http.get.mockResolvedValue(page([swapiFilm(1)]));
      filmRepository.upsert.mockRejectedValue(new Error('db caida'));

      const error = await service.sincronize().catch((e) => e);

      expect(error).not.toBeInstanceOf(BadGatewayException);
      expect(error.message).toBe('db caida');
    });
  });
});
