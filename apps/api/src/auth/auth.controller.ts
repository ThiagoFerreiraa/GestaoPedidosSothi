import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import * as express from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);

    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);

    return { accessToken, user };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      user.id,
      user.email,
      user.role,
    );

    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('refresh_token');
    return { message: 'Logout realizado com sucesso' };
  }
}
