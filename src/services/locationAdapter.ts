import { Platform } from 'react-native';
import { locationService as nativeLocation } from './locationAdapter.native';
import { locationService as webLocation } from './locationAdapter.web';

export const locationService = Platform.OS === 'web' ? webLocation : nativeLocation;
