import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

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

  @ApiProperty({ example: '1977-05-25', description: 'Format YYYY-MM-DD' })
  @IsDateOnly()
  release_date: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  characters: string[];

  
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  planets: string[];


  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  starships: string[];


  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  vehicles: string[];


  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  species: string[];

  @IsOptional()
  @IsUrl()
  url?: string;
}
