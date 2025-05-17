import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class SpotifyAuthGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers['authorization'].replace('Bearer ', '');

    // console.log(accessToken);

    if (!accessToken) {
      throw new UnauthorizedException('No session ID provided');
    }

    const session = this.sessionService.checkSession(accessToken);

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // Add session to request for use in controllers
    request.session = session;

    return true;
  }
}
