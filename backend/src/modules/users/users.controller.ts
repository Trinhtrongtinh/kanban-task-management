import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../database/entities';
import { ResponseMessage } from '../../common/decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ResponseMessage('User created successfully')
  async create(
    @Body() body: { username: string; email: string },
  ): Promise<User> {
    return this.usersService.create(body.username, body.email);
  }

  @Get()
  @ResponseMessage('Users retrieved successfully')
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
