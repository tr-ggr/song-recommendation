import { Body, Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  private sessions = new Map<string, any>();

  checkSession(access_token) {
    const result = this.sessions.get(access_token);

    if (result) {
      return result;
    } else {
      return null;
    }
  }

  addSession(body) {
    this.sessions.set(body.access_token, body);
  }

  removeSession(access_token) {
    this.sessions.delete(access_token);
  }
}
