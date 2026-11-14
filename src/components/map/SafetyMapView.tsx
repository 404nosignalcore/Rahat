import React from 'react';
import { Platform } from 'react-native';
import { SafetyMapView as NativeMap, SafetyMapViewProps } from './SafetyMapView.native';
import { SafetyMapView as WebMap } from './SafetyMapView.web';

export type { SafetyMapViewProps };

export const SafetyMapView: React.FC<SafetyMapViewProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebMap {...props} />;
  }
  return <NativeMap {...props} />;
};
