import React from 'react';
import { SafetyMapView as NativeMap, SafetyMapViewProps } from './SafetyMapView.native';

export type { SafetyMapViewProps };

export const SafetyMapView: React.FC<SafetyMapViewProps> = (props) => {
  return <NativeMap {...props} />;
};
