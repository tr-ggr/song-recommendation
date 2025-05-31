import { Body, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT })
export class SessionService {
  private static readonly sessions = new Map<string, any>();

  checkSession(access_token) {
    const result = SessionService.sessions.get(access_token);
    console.log(SessionService.sessions);

    if (result) {
      return result;
    } else {
      return null;
    }
  }

  addSession(body) {
    SessionService.sessions.set(body.access_token, body);
  }

  removeSession(access_token) {
    SessionService.sessions.delete(access_token);
  }
}
