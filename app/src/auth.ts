import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const lichessHost = 'https://lichess.org';

export interface Me {
  id: string;
  username: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

const config = {
  clientId: 'lichess-api-demo', // Replace with your actual Lichess OAuth app client ID
  scopes: ['challenge:write', 'bot:play'],
  authorizationEndpoint: `${lichessHost}/oauth`,
  tokenEndpoint: `${lichessHost}/api/token`,
};

// Use a custom URL scheme for your app
const scheme = "com.example.LeChessApp"; // Replace with your app's custom URL scheme

export class Auth {
  me?: Me;
  redirectUri: string;

  constructor() {
    this.redirectUri = this.createRedirectUri();
    console.log('Redirect URI:', this.redirectUri);
  }

  createRedirectUri() {
    return `${scheme}://oauth-callback`;
  }

  async login() {
    console.log('Logging in with expo-auth-session...');
    try {
      const discovery = {
        authorizationEndpoint: config.authorizationEndpoint,
        tokenEndpoint: config.tokenEndpoint,
      };

      console.log("Discovery:", discovery);

      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        redirectUri: this.redirectUri,
        scopes: config.scopes,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
      });

      console.log("Auth request", authRequest);

      const authResult = await authRequest.promptAsync(discovery);
      console.log('Authorization result:', authResult);

      if (authResult.type !== 'success' || !authResult.params.code) {
        console.log('Authorization failed or no code:', authResult);
        throw new Error('Authorization failed or access token is missing');
      }

      console.log('Authorization successful, code received:', authResult.params.code);

      // Retrieve the code_verifier from the authRequest
      const codeVerifier = authRequest.codeVerifier;

      if (!codeVerifier) {
        throw new Error('Code verifier is missing');
      }

      // Exchange the authorization code for an access token
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          code: authResult.params.code,
          clientId: config.clientId,
          redirectUri: this.redirectUri,
          extraParams: {
            code_verifier: codeVerifier,
          },
        },
        discovery
      );

      console.log('Token response:', tokenResponse);

      if (!tokenResponse.accessToken) {
        throw new Error('Failed to obtain access token');
      }

      const accessToken = tokenResponse.accessToken;
      const expiresIn = tokenResponse.expiresIn || 3600; // Default to 1 hour if expiresIn is not available

      console.log('Access Token:', accessToken);
      console.log('Expires In:', expiresIn);

      // Fetch user profile
      const profileResponse = await fetch(`${lichessHost}/api/account`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Profile response:', profileResponse);

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch profile: ${profileResponse.statusText}`);
      }

      const profile = await profileResponse.json();

      this.me = {
        id: profile.id,
        username: profile.username,
        accessToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000), // Use actual expiresIn value
      };

      await AsyncStorage.setItem('authState', JSON.stringify(this.me));
      console.log('Login successful:', this.me);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async manualLogin(token: string) {
    try {
      // Fetch user profile using the provided token
      const profileResponse = await fetch(`${lichessHost}/api/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch profile: ${profileResponse.statusText}`);
      }

      const profile = await profileResponse.json();

      this.me = {
        id: profile.id,
        username: profile.username,
        accessToken: token,
        expiresAt: new Date(Date.now() + 3600 * 1000), // Default to 1 hour expiration
      };

      await AsyncStorage.setItem('authState', JSON.stringify(this.me));
      console.log('Manual login successful:', this.me);
    } catch (error) {
      console.error('Manual login error:', error);
      throw error;
    }
  }

  async init() {
    const storedAuthState = await AsyncStorage.getItem('authState');
    if (storedAuthState) {
      this.me = JSON.parse(storedAuthState);
      if (this.me && new Date(this.me.expiresAt) < new Date()) {
        await this.refreshToken();
      }
    }
  }

  async logout() {
    this.me = undefined;
    await AsyncStorage.removeItem('authState');
    console.log('Logged out');
  }

  async refreshToken() {
    console.warn('Token refresh is not supported directly with implicit flow in expo-auth-session.');
    await this.logout();
    await this.login();
  }
}
