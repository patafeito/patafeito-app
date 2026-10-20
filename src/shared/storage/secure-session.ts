import * as SecureStore from 'expo-secure-store';

const refreshTokenKey = 'patafeito.refresh-token';
const accessTokenKey = 'patafeito.access-token';
export const secureSession = {
  saveRefreshToken: (token: string) => SecureStore.setItemAsync(refreshTokenKey, token),
  getRefreshToken: () => SecureStore.getItemAsync(refreshTokenKey),
  clear: () => SecureStore.deleteItemAsync(refreshTokenKey),
  saveAccessToken: (token: string) => SecureStore.setItemAsync(accessTokenKey, token),
  getAccessToken: () => SecureStore.getItemAsync(accessTokenKey),
  clearAccessToken: () => SecureStore.deleteItemAsync(accessTokenKey),
};
