import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';
import { AuthServiceService } from './auth-service.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthServiceService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/protocol/openid-connect/token')) {
      return next.handle(req);
    }
    return from(this.authService.getToken() as Promise<string>).pipe(
      switchMap((token: string) => {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        });
        return next.handle(cloned);
      })
    );
  }
}
