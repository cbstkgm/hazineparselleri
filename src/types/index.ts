export interface ParcelRecord {
  id?: string;
  ilad?: string;
  ilcead?: string;
  mahallead?: string;
  adano?: string | number;
  parselno?: string | number;
  geom?: string;
  [key: string]: any;
}

export type MapBaseLayer = 'osm' | 'google_satellite' | 'google_hybrid' | 'yandex';
