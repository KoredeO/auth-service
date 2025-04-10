import { Body, Controller, Get, Post, Req, Res, Query, UseGuards, Redirect } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignUpDto, LoginDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @Redirect()
  async googleAuth() {
    const googleAuthURL = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams();
    params.append('client_id', this.configService.get('GOOGLE_CLIENT_ID') || '');
    params.append('redirect_uri', this.configService.get('GOOGLE_CALLBACK_URL') || '');
    params.append('response_type', 'code');
    params.append('scope', 'email profile');
    params.append('prompt', 'consent');
    
    return { url: `${googleAuthURL}?${params.toString()}` };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { token, user } = await this.authService.googleLogin(req);
    // Redirect to the frontend with the token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req) {
    return req.user;
  }
}
