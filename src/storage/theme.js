import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'theme_mode'; // 'light' | 'dark'

export async function getThemeMode() {
  return AsyncStorage.getItem(KEY);
}

export async function setThemeMode(mode) {
  await AsyncStorage.setItem(KEY, mode);
}