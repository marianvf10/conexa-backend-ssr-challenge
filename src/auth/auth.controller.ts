import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

const tokenResponse = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  email: 'user@example.com',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'The new user always gets the "user" role.',
  })
  @ApiCreatedResponse({
    description: 'User created, returns an access token',
    schema: { example: tokenResponse },
  })
  @ApiBadRequestResponse({
    description: 'Invalid data or the email is already registered',
  })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('sign-in')
  @ApiOperation({ summary: 'Log in and get an access token' })
  @ApiCreatedResponse({
    description: 'Returns an access token (valid for 2 hours)',
    schema: { example: tokenResponse },
  })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Credentials are not valid' })
  loginUser(@Body() loginUser: LoginUserDto) {
    return this.authService.login(loginUser);
  }
}
