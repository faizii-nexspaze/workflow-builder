import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private keycloakUrl = 'http://172.16.16.53:8001';
  private realm = 'Customers';
  private clientId = 'customer-API-client';
  private clientSecret = '5K54CZ7rqR5s8SvmekJZRwBtrf3HCCkb';
  private username = 'customer_admin';
  private password = '12345';
  private scope = 'openid';

  private tokenEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  constructor(private http: HttpClient) {}

  async getToken(): Promise<string> {
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      return this.accessToken;
    }
    const stored = localStorage.getItem('auth_tokens');
    if (stored) {
      const { access_token, refresh_token, expires_at } = JSON.parse(stored);
      if (access_token && expires_at && Date.now() < expires_at) {
        this.accessToken = access_token;
        this.refreshToken = refresh_token;
        this.expiresAt = expires_at;
        return access_token;
      }
      this.refreshToken = refresh_token;
      this.expiresAt = expires_at;
    }
    if (this.refreshToken && this.expiresAt && Date.now() >= this.expiresAt) {
      try {
        const newToken = await this.refreshAccessToken(this.refreshToken);
        return newToken;
      } catch (e) {
        console.warn('Refresh token failed, falling back to password grant');
      }
    }
    return this.fetchNewToken();
  }

  private async fetchNewToken(): Promise<string> {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', this.clientId)
      .set('client_secret', this.clientSecret)
      .set('username', this.username)
      .set('password', this.password)
      .set('scope', this.scope);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    try {
      const response: any = await firstValueFrom(
        this.http.post(this.tokenEndpoint, body.toString(), { headers })
      );
      this.saveTokens(response);
      return response.access_token;
    } catch (error) {
      console.error('Admin token fetch failed:', error);
      throw error;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', this.clientId)
      .set('client_secret', this.clientSecret)
      .set('refresh_token', refreshToken);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    try {
      const response: any = await firstValueFrom(
        this.http.post(this.tokenEndpoint, body.toString(), { headers })
      );
      this.saveTokens(response);
      return response.access_token;
    } catch (error) {
      console.error('Refresh token fetch failed:', error);
      throw error;
    }
  }

  private saveTokens(response: any) {
    this.accessToken = response.access_token;
    this.refreshToken = response.refresh_token;
    this.expiresAt = Date.now() + (response.expires_in * 1000) - 10000;
    localStorage.setItem('auth_tokens', JSON.stringify({
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      expires_at: this.expiresAt
    }));
  }
}
