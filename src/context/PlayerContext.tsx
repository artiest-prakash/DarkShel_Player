import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { MediaFile, WatchProgress } from '../types';

interface PlayerContextType {
  // State
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  isFullscreen: boolean;
  setIsFullscreen: (full: boolean) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  isHDR: boolean;
  setIsHDR: (hdr: boolean) => void;
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean) => void;
  isRepeat: boolean;
  setIsRepeat: (repeat: boolean) => void;
  watchHistory: Record<string, WatchProgress>;
  setWatchHistory: React.Dispatch<React.SetStateAction<Record<string, WatchProgress>>>;
  showHistoryModal: boolean;
  setShowHistoryModal: (show: boolean) => void;
  
  // Media
  currentMedia: MediaFile | null;
  setCurrentMedia: (media: MediaFile | null) => void;
  playlist: MediaFile[];
  setPlaylist: (playlist: MediaFile[]) => void;
  
  // Video Ref
  videoRef: React.RefObject<HTMLVideoElement | null>;
  
  // Actions
  togglePlay: () => void;
  toggleMute: () => void;
  seekBy: (seconds: number) => void;
  playNext: () => void;
  playPrevious: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('auto');
  const [isHDR, setIsHDR] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [watchHistory, setWatchHistory] = useState<Record<string, WatchProgress>>(() => {
    try {
      const saved = localStorage.getItem('darkshel_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  
  const [currentMedia, setCurrentMedia] = useState<MediaFile | null>(null);
  const [playlist, setPlaylist] = useState<MediaFile[]>([]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const seekBy = (seconds: number) => {
    if (videoRef.current) {
      let newTime = videoRef.current.currentTime + seconds;
      newTime = Math.max(0, Math.min(newTime, duration));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const playNext = () => {
    if (!currentMedia || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(m => m.id === currentMedia.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentMedia(playlist[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (!currentMedia || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(m => m.id === currentMedia.id);
    if (currentIndex > 0) {
      setCurrentMedia(playlist[currentIndex - 1]);
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };
  
  // Sync volume with video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);
  
  // Sync playback rate with video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    localStorage.setItem('darkshel_history', JSON.stringify(watchHistory));
  }, [watchHistory]);

  return (
    <PlayerContext.Provider
      value={{
        isPlaying, setIsPlaying,
        volume, setVolume,
        muted, setMuted,
        currentTime, setCurrentTime,
        duration, setDuration,
        playbackRate, setPlaybackRate,
        isFullscreen, setIsFullscreen,
        aspectRatio, setAspectRatio,
        isHDR, setIsHDR,
        isShuffle, setIsShuffle,
        isRepeat, setIsRepeat,
        watchHistory, setWatchHistory,
        showHistoryModal, setShowHistoryModal,
        currentMedia, setCurrentMedia,
        playlist, setPlaylist,
        videoRef,
        togglePlay, toggleMute, seekBy, playNext, playPrevious
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
