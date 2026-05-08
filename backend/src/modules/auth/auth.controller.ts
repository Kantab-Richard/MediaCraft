import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create a user account and API key' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'strong-password' },
        name: { type: 'string', example: 'MediCraft User' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  signup(@Body() body: { email: string; password: string; name?: string }) {
    return this.authService.signup(body.email, body.password, body.name);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate an existing user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'strong-password' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.login(body.email, body.password);

    if (!result) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return result;
  }

  @Post('google')
  @ApiOperation({ summary: 'Authenticate with Google ID token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['idToken'],
      properties: {
        idToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  google(@Body() body: { idToken: string }) {
    return this.authService.loginWithGoogle(body.idToken);
  }
}
