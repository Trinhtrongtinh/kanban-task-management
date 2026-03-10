import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from './guards';
import { User } from '../../database/entities';
import { CurrentUser, ResponseMessage } from '../../common/decorators';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ResponseMessage('User registered successfully')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Profile retrieved successfully')
  async getProfile(
    @CurrentUser('userId') userId: string,
  ): Promise<Partial<User> | null> {
    return this.authService.getProfile(userId);
  }
}
