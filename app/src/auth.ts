import { authorize, refresh, AuthConfiguration, AuthorizeResult } from 'react-native-app-auth';
import { readStream } from './ndJsonStream';
import { BASE_PATH } from './routing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';

export const lichessHost = 'https://lichess.org';
// export const lichessHost = 'http://l.org';
export const scopes = ['board:play'];
export const clientId = 'lichess-api-demo';
export const clientUrl = `com.example.lechessapp`;

export interface Me {
  id: string;
  username: string;
  httpClient: HttpClient; // with pre-set Authorization header
  perfs: { [key: string]: any };
}

export interface HttpClient {
  (input: RequestInfo, init?: RequestInit): Promise<Response>;
}

export class Auth {
  // Configure react-native-app-auth
  config: AuthConfiguration = {
    issuer: `${lichessHost}/oauth`,
    clientId: clientId,
    redirectUrl: `com.example.lechessapp://oauthredirect`,
    scopes: scopes,
    serviceConfiguration: {
      authorizationEndpoint: `${lichessHost}/oauth`,
      tokenEndpoint: `${lichessHost}/api/token`,
    },
  };

  me?: Me;
  authState?: AuthorizeResult;

  get isLoggedIn(): boolean {
    return !!this.me;
  }

  async init() {
    try {
      const storedAuth = await AsyncStorage.getItem('auth_state');
      if (storedAuth) {
        this.authState = JSON.parse(storedAuth);
        await this.authenticate();
      }
    } catch (err) {
      console.error(err);
    }
    if (!this.me) {
      try {
        const hasAuthCode = await this.isReturningFromAuthServer();
        if (hasAuthCode) await this.authenticate();
      } catch (err) {
        console.error(err);
      }
    }
  }

  private isReturningFromAuthServer = async (): Promise<boolean> => {
    // Implement the method or use appropriate logic
    return false;
  }

  async login() {
    try {
      this.authState = await authorize(this.config);
      await AsyncStorage.setItem('auth_state', JSON.stringify(this.authState));
      await this.authenticate();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async manualLogin(token: string) {
    this.authState = { 
      accessToken: token, 
      accessTokenExpirationDate: '', 
      refreshToken: '', 
      idToken: '', 
      tokenType: '', 
      scopes: [], 
      authorizationCode: '' 
    };
    await AsyncStorage.setItem('auth_state', JSON.stringify(this.authState));
    await this.authenticate();
  }

  async logout() {
    if (this.me) await this.me.httpClient(`${lichessHost}/api/token`, { method: 'DELETE' });
    await AsyncStorage.removeItem('auth_state');
    this.me = undefined;
  }

  // Update the refreshToken method to use the correct OAuth2 method
  async refreshToken() {
    try {
      if (this.authState?.refreshToken) {
        this.authState = await refresh(this.config, {
          refreshToken: this.authState.refreshToken,
        }) as AuthorizeResult;
        await AsyncStorage.setItem('auth_state', JSON.stringify(this.authState));
        await this.authenticate();
      } else {
        throw new Error('No refresh token available');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  private authenticate = async () => {
    // Retrieve the token from AsyncStorage
    const token = this.authState?.accessToken;
    if (!token) {
      throw new Error('No access token found');
    }

    // Create a custom fetch function with Authorization header
    const authorizedFetch = (input: RequestInfo, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    };

    // Decorate the fetch function
    const httpClient = this.decorateFetchHTTPClient(authorizedFetch);

    const res = await httpClient(`${lichessHost}/api/account`);
    const me = {
      ...(await res.json()),
      httpClient,
    };
    if (me.error) throw me.error;
    this.me = me;
  };

  decorateFetchHTTPClient = (fetchFn: HttpClient): HttpClient => {
    return fetchFn;
  };

  openStream = async (path: string, config: any, handler: (_: any) => void) => {
    return readStream(
      `STREAM ${path}`,
      `${lichessHost}${path}`,
      {
        Authorization: `Bearer ${this.authState?.accessToken}`,
        ...config.headers,
      },
      handler
    );
  };

  fetchBody = async (path: string, config: any = {}) => {
    const res = await this.fetchResponse(path, config);
    const body = await res.json();
    return body;
  };

  private fetchResponse = async (path: string, config: any = {}) => {
    console.log(`Requesting: ${lichessHost}${path}`, config);
    const res = await (this.me?.httpClient || window.fetch)(`${lichessHost}${path}`, config);
    if (!res.ok) {
      const err = `${res.status} ${res.statusText}`;
      alert(err);
      throw err;
    }
    return res;
  };
}

export const auth = new Auth();
