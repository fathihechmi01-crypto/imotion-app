declare module 'react-native-calendars' {
  import { ComponentType } from 'react';

  export const Calendar: ComponentType<any>;

  export type DateData = {
    dateString: string;
    day: number;
    month: number;
    year: number;
    timestamp: number;
  };
}