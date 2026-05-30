import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export function useShortcuts() {
  const player = usePlayer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      const { togglePlay, seekBy, toggleMute, setVolume, volume, setIsFullscreen, isFullscreen, setPlaybackRate } = player;
      
      switch (e.key.toLowerCase()) {
        case ' ': // Space = Play / Pause
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f': // F = Fullscreen
          e.preventDefault();
          if (!isFullscreen) {
            document.documentElement.requestFullscreen().catch((err) => console.log(err));
            setIsFullscreen(true);
          } else {
            document.exitFullscreen().catch((err) => console.log(err));
            setIsFullscreen(false);
          }
          break;
        case 'escape': // Esc = Exit Fullscreen
          if (isFullscreen) {
            document.exitFullscreen().catch((err) => console.log(err));
            setIsFullscreen(false);
          }
          break;
        case 'arrowleft': // Left Arrow = Rewind 10 seconds
          e.preventDefault();
          seekBy(-10);
          break;
        case 'arrowright': // Right Arrow = Forward 10 seconds
          e.preventDefault();
          seekBy(10);
          break;
        case 'j': // J = Rewind 30 seconds
          e.preventDefault();
          seekBy(-30);
          break;
        case 'l': // L = Forward 30 seconds
          e.preventDefault();
          seekBy(30);
          break;
        case 'arrowup': // Up Arrow = Volume Up
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'arrowdown': // Down Arrow = Volume Down
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'm': // M = Mute
          e.preventDefault();
          toggleMute();
          break;
        case '2': // Speed hold
          e.preventDefault();
          setPlaybackRate(2);
          break;
        case '3':
          e.preventDefault();
          setPlaybackRate(3);
          break;
        case '4':
          e.preventDefault();
          setPlaybackRate(4);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { setPlaybackRate } = player;
      
      switch (e.key) {
        case '2':
        case '3':
        case '4':
          e.preventDefault();
          setPlaybackRate(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [player]);
}
