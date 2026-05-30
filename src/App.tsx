import React, { useRef, useState } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { useShortcuts } from './hooks/useShortcuts';
import { VideoPlayer } from './components/VideoPlayer';
import { MediaFile } from './types';

function PlayerLayout() {
  useShortcuts();
  const { setPlaylist, playlist, setCurrentMedia, setIsPlaying, currentMedia } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const newMedia: MediaFile[] = files
      .filter(f => f.type.startsWith('video/') || f.type.startsWith('audio/'))
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        url: URL.createObjectURL(file), // Local web playback natively
        type: file.type.startsWith('video/') ? 'video' : 'audio',
      }));

    if (newMedia.length > 0) {
      setPlaylist([...playlist, ...newMedia]);
      if (!currentMedia) {
         setCurrentMedia(newMedia[0]);
         setIsPlaying(true);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div 
      className="w-screen h-screen bg-[#0b0c10] overflow-hidden flex font-sans text-white select-none"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        multiple 
        accept="video/*,audio/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
      
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-primary/20 backdrop-blur-sm border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="text-4xl font-display font-bold text-white drop-shadow-lg">
            DROP MEDIA HERE
          </div>
        </div>
      )}

      {/* Main Layout Elements */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full w-full">
         <VideoPlayer onOpenClick={() => fileInputRef.current?.click()} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <PlayerLayout />
    </PlayerProvider>
  );
}
