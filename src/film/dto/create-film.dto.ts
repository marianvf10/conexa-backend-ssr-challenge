import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateFilmDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  swapiId?: number;

  @IsInt()
  @IsPositive()
  episode_id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  opening_crawl: string;

  @IsString()
  @IsNotEmpty()
  director: string;

  @IsString()
  @IsNotEmpty()
  producer: string;

  @IsDateString()
  release_date: string;

  @IsArray()
  @IsUrl({}, { each: true })
  characters: string[];

  @IsArray()
  @IsUrl({}, { each: true })
  planets: string[];

  @IsArray()
  @IsUrl({}, { each: true })
  starships: string[];

  @IsArray()
  @IsUrl({}, { each: true })
  vehicles: string[];

  @IsArray()
  @IsUrl({}, { each: true })
  species: string[];

  @IsOptional()
  @IsDateString()
  created?: string;

  @IsOptional()
  @IsDateString()
  edited?: string;

  @IsOptional()
  @IsUrl()
  url?: string;
}
