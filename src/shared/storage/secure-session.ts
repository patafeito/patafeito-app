import * as SecureStore from 'expo-secure-store';

const refreshTokenKey = 'patafeito.refresh-token';
export const secureSession = {
  saveRefreshToken: (token: string) => SecureStore.setItemAsync(refreshTokenKey, token),
  getRefreshToken: () => SecureStore.getItemAsync(refreshTokenKey),
  clear: () => SecureStore.deleteItemAsync(refreshTokenKey),
};
