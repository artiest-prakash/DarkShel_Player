export interface MediaFile {
  id: string;
  name: string;
  url: string;
  duration?: number;
  type: 'video' | 'audio';
  poster?: string;
  badges?: string[];
}

export type Subtitle = {
  id: string;
  url: string;
  lang: string;
};

export type EqualityPreset = 'Flat' | 'Movie' | 'Gaming' | 'Music' | 'Bass' | 'Custom';

export interface WatchProgress {
  currentTime: number;
  duration: number;
  lastWatched: number;
  thumbnail?: string;
}
