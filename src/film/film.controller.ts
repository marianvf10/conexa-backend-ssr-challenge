import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FilmService } from './film.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './entities/film.entity';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/interfaces/valid-roles';

@ApiTags('Film')
@Controller('film')
export class FilmController {
  constructor(private readonly filmService: FilmService) {}

  @Post()
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: 'Create a film (admin only)' })
  @ApiCreatedResponse({ description: 'Film created', type: Film })
  @ApiBadRequestResponse({ description: 'Invalid film data' })
  create(@Body() createFilmDto: CreateFilmDto) {
    return this.filmService.create(createFilmDto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List all films (any authenticated user)' })
  @ApiOkResponse({ description: 'List of films', type: [Film] })
  findAll() {
    return this.filmService.findAll();
  }

  @Post('sync')
  @Auth(ValidRoles.admin)
  @ApiOperation({
    summary: 'Sync films with the Star Wars API (admin only)',
    description:
      'Fetches every film from the Star Wars API and upserts them by swapiId. ' +
      'Local changes to synced films are overwritten.',
  })
  @ApiOkResponse({
    description: 'Number of films synced',
    schema: { example: { synced: 6 } },
  })
  @ApiBadGatewayResponse({
    description: 'The Star Wars API failed, timed out or is unreachable',
  })
  sincronize() {
    return this.filmService.sincronize();
  }

  @Get(':id')
  @Auth(ValidRoles.user)
  @ApiOperation({ summary: 'Get a film by id (regular users only)' })
  @ApiOkResponse({ description: 'Film details', type: Film })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Film not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.filmService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: 'Update a film (admin only)' })
  @ApiOkResponse({ description: 'Film updated', type: Film })
  @ApiBadRequestResponse({ description: 'Invalid id or film data' })
  @ApiNotFoundResponse({ description: 'Film not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFilmDto: UpdateFilmDto,
  ) {
    return this.filmService.update(id, updateFilmDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: 'Delete a film (admin only)' })
  @ApiOkResponse({ description: 'Film deleted' })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Film not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.filmService.remove(id);
  }
}
