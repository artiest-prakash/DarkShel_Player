import React, { useRef, useEffect, useState } from "react";
import { usePlayer } from "../context/PlayerContext";
import { cn } from "../lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  PictureInPicture,
  Repeat,
  Shuffle,
  Subtitles,
  Cast,
  History,
  X,
  AudioLines,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function VideoPlayer({ onOpenClick }: { onOpenClick?: () => void }) {
  const {
    currentMedia,
    videoRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    muted,
    toggleMute,
    togglePlay,
    isFullscreen,
    setIsFullscreen,
    playNext,
    playPrevious,
    aspectRatio,
    setAspectRatio,
    isHDR,
    setIsHDR,
    isShuffle,
    setIsShuffle,
    isRepeat,
    setIsRepeat,
    watchHistory,
    setWatchHistory,
    showHistoryModal,
    setShowHistoryModal,
  } = usePlayer();

  const [showControls, setShowControls] = useState(true);
  const [videoQuality, setVideoQuality] = useState("");
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);

  const hideControlsTimeout = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (currentMedia && videoRef.current.duration > 0) {
        setWatchHistory((prev) => ({
          ...prev,
          [currentMedia.name]: {
            ...prev[currentMedia.name],
            currentTime: videoRef.current.currentTime,
            duration: videoRef.current.duration,
            lastWatched: Date.now(),
          },
        }));
      }

      // Capture thumbnail if not exists and we played a bit (e.g. > 1 sec)
      if (
        currentMedia &&
        videoRef.current.duration > 0 &&
        videoRef.current.currentTime > 1
      ) {
        setWatchHistory((prev) => {
          const hist = prev[currentMedia.name];
          if (
            hist &&
            !hist.thumbnail &&
            canvasRef.current &&
            videoRef.current
          ) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              canvasRef.current.width = 160;
              canvasRef.current.height = 90;
              ctx.drawImage(videoRef.current, 0, 0, 160, 90);
              try {
                const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.5);
                return {
                  ...prev,
                  [currentMedia.name]: {
                    ...hist,
                    thumbnail: dataUrl,
                  },
                };
              } catch (e) {
                // Ignore cross-origin error
              }
            }
          }
          return prev;
        });
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);

      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      if (height >= 2160) setVideoQuality("4K");
      else if (height >= 1440) setVideoQuality("1440p");
      else if (height >= 1080) setVideoQuality("1080p");
      else if (height >= 720) setVideoQuality("720p");
      else if (height >= 480) setVideoQuality("480p");
      else if (height >= 360) setVideoQuality("360p");
      else if (height >= 240) setVideoQuality("240p");
      else if (height > 0) setVideoQuality(`${height}p`);

      if (currentMedia && watchHistory[currentMedia.name]) {
        const history = watchHistory[currentMedia.name];
        if (
          history.currentTime > 0 &&
          history.currentTime < videoRef.current.duration - 5
        ) {
          videoRef.current.currentTime = history.currentTime;
        }
      }

      // Try extract text/audio tracks
      const tTracks = [];
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        tTracks.push(videoRef.current.textTracks[i]);
      }
      setTextTracks(tTracks);

      if ((videoRef.current as any).audioTracks) {
        const aTracks = [];
        for (let i = 0; i < (videoRef.current as any).audioTracks.length; i++) {
          aTracks.push((videoRef.current as any).audioTracks[i]);
        }
        setAudioTracks(aTracks);
      }

      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);
    if (hrs > 0)
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    window.clearTimeout(hideControlsTimeout.current);
    if (isPlaying) {
      setShowControls(false); // Disappear immediately when video plays
    } else if (!isPlaying) {
      setShowControls(true);
    }
    return () => window.clearTimeout(hideControlsTimeout.current);
  }, [isPlaying]);

  const handleMouseMove = () => {
    setShowControls(true);
    window.clearTimeout(hideControlsTimeout.current);

    if (isPlaying) {
      hideControlsTimeout.current = window.setTimeout(
        () => setShowControls(false),
        1000,
      );
    }
  };

  const handleCast = async () => {
    // This uses the presentation API or cast framework. In a simple web wrapper, just alerts.
    // In a real Electron app with cast support, ipcRenderer would be used.
    try {
      if ("presentation" in navigator && navigator.presentation) {
        const request = new PresentationRequest(["cast://"]);
        await request.start();
      } else {
        alert(
          "Cast requires a network accessible media URL or Cast extension.",
        );
      }
    } catch (e) {
      console.log(e);
      alert("Chromecast is not supported or no devices found for local app.");
    }
  };

  const togglePiP = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled && videoRef.current) {
      await videoRef.current.requestPictureInPicture();
    }
  };

  let videoStyle: React.CSSProperties = {
    objectFit: aspectRatio === "stretch" ? "fill" : "contain",
  };

  if (aspectRatio === "16:9") videoStyle.aspectRatio = "16/9";
  else if (aspectRatio === "4:3") videoStyle.aspectRatio = "4/3";
  else if (aspectRatio === "21:9") videoStyle.aspectRatio = "21/9";

  if (isHDR) {
    videoStyle.filter = "contrast(1.15) saturate(1.3) brightness(1.05)";
  }

  return (
    <div
      className={cn(
        "relative bg-black overflow-hidden flex flex-col group",
        isFullscreen ? "w-screen h-screen fixed inset-0 z-50" : "w-full h-full",
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDoubleClick={() => {
        if (!currentMedia) return;
        if (!isFullscreen) {
          document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } else {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }}
    >
      {/* Video Element */}
      {currentMedia ? (
        <video
          ref={videoRef}
          src={currentMedia.url}
          className="absolute inset-0 w-full h-full"
          style={videoStyle}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={() => {
            togglePlay();
            setShowHistoryModal(false);
          }}
          autoPlay={isPlaying}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0c10] text-white">
          <button
            onClick={onOpenClick}
            className="w-24 h-24 rounded-full bg-primary/20 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/40 hover:scale-105 transition-all text-primary hover:text-white group border border-primary/30"
          >
            <Play className="w-10 h-10 fill-current ml-2" />
          </button>
          <p className="mt-8 text-xl font-display font-medium tracking-wide text-white/80">
            Open a video
          </p>
          <p className="mt-2 text-sm text-white/40">
            Drag & drop or click to select
          </p>
        </div>
      )}

      {/* Hidden canvas for thumbnail extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlays / Gradients */}
      {currentMedia && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
          {/* Top Gradient */}
          <div
            className={cn(
              "h-32 bg-gradient-to-b from-black/80 to-transparent p-6 flex justify-between items-start transition-all duration-700 ease-in-out",
              showControls || !isPlaying
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "-translate-y-full opacity-0 pointer-events-none",
            )}
          >
            {currentMedia && (
              <div>
                <h1 className="text-xl font-display font-medium text-white drop-shadow-md">
                  {currentMedia.name.replace(/\.[^/.]+$/, "")}
                </h1>
                <div className="flex gap-2 mt-2">
                  {videoQuality && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 border border-white/20 font-bold uppercase">
                      {videoQuality}
                    </span>
                  )}

                  <button
                    onClick={() => setIsHDR(!isHDR)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] border font-bold uppercase transition-colors uppercase",
                      isHDR
                        ? "bg-primary/20 border-primary/50 text-white"
                        : "bg-white/10 border-white/20 text-white/60 hover:text-white",
                    )}
                    title="Toggle HDR Enhancement"
                  >
                    HDR
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-4 text-white/80">
              <button
                onClick={() => {
                  const ratios = ["auto", "16:9", "4:3", "21:9", "stretch"];
                  const next =
                    ratios[(ratios.indexOf(aspectRatio) + 1) % ratios.length];
                  setAspectRatio(next);
                }}
                className="px-2 py-1 bg-white/10 rounded text-xs font-bold hover:text-white transition-colors uppercase"
                title="Change Aspect Ratio"
              >
                {aspectRatio}
              </button>
              <button
                onClick={() => setShowHistoryModal(!showHistoryModal)}
                className={cn(
                  "hover:text-white transition-colors",
                  showHistoryModal && "text-primary",
                )}
                title="Watch History"
              >
                <History className="w-5 h-5" />
              </button>
              <Cast
                className="w-5 h-5 cursor-pointer hover:text-white"
                onClick={handleCast}
              />
              <PictureInPicture
                className="w-5 h-5 cursor-pointer hover:text-white"
                onClick={togglePiP}
              />
            </div>
          </div>

          {/* History Modal */}
          {showHistoryModal && (
            <div className="absolute top-24 right-6 w-80 max-h-[60vh] bg-[#0b0c10]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-y-auto no-scrollbar z-50 shadow-2xl flex flex-col pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-medium tracking-wide">
                  Watch History
                </h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="hover:text-white/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {Object.entries(watchHistory)
                  .sort((a, b) => b[1].lastWatched - a[1].lastWatched)
                  .map(([name, progress]) => (
                    <div
                      key={name}
                      className="flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default items-center"
                    >
                      {progress.thumbnail ? (
                        <img
                          src={progress.thumbnail}
                          className="w-20 h-12 object-cover rounded bg-black/40"
                          alt=""
                        />
                      ) : (
                        <div className="w-20 h-12 bg-black/40 rounded flex items-center justify-center">
                          <Play className="w-4 h-4 text-white/40" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium truncate">
                            {name.replace(/\.[^/.]+$/, "")}
                          </span>
                        </div>
                        <span className="text-xs text-white/40 whitespace-nowrap">
                          {formatTime(progress.currentTime)} /{" "}
                          {formatTime(progress.duration)}
                        </span>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(progress.currentTime / progress.duration) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                {Object.keys(watchHistory).length === 0 && (
                  <div className="text-sm text-white/40 text-center py-4">
                    No history yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Controls Gradient */}
          <div
            className={cn(
              "h-48 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-6 gap-4 pb-8 transition-all duration-700 ease-in-out",
              showControls || !isPlaying
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "translate-y-full opacity-0 pointer-events-none",
            )}
          >
            {/* Progress row */}
            <div className="flex items-center gap-4 text-sm font-mono text-white/80">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 relative h-1.5 group/progress cursor-pointer flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                />
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-500 to-primary rounded-full transition-all duration-75"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {/* Thumb */}
                <div
                  className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(92,65,255,0.8)] -ml-1.5 pointer-events-none transition-transform scale-0 group-hover/progress:scale-100"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-5 text-white/70">
                <div className="relative">
                  <button
                    className="hover:text-white transition-colors"
                    title="Audio Tracks"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAudioMenu(!showAudioMenu);
                      setShowSubMenu(false);
                    }}
                  >
                    <AudioLines className="w-5 h-5" />
                  </button>
                  {showAudioMenu && (
                    <div className="absolute bottom-full left-0 mb-4 bg-black/90 backdrop-blur-md rounded-lg py-2 min-w-[150px] shadow-xl border border-white/10 z-50">
                      <div className="px-3 py-1 text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                        Audio Tracks
                      </div>
                      {audioTracks.length > 0 ? (
                        audioTracks.map((track, i) => (
                          <button
                            key={i}
                            className={cn(
                              "w-full text-left px-4 py-1.5 text-sm hover:bg-white/10 hover:text-white",
                              track.enabled
                                ? "text-primary font-medium"
                                : "text-white/80",
                            )}
                            onClick={() => {
                              for (let j = 0; j < audioTracks.length; j++)
                                audioTracks[j].enabled = false;
                              track.enabled = true;
                              setShowAudioMenu(false);
                            }}
                          >
                            {track.label || `Track ${i + 1}`}{" "}
                            {track.language && `(${track.language})`}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-white/40">
                          Default Track
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="hover:text-white transition-colors"
                    title="Subtitles"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSubMenu(!showSubMenu);
                      setShowAudioMenu(false);
                    }}
                  >
                    <Subtitles className="w-5 h-5" />
                  </button>
                  {showSubMenu && (
                    <div className="absolute bottom-full left-0 mb-4 bg-black/90 backdrop-blur-md rounded-lg py-2 min-w-[150px] shadow-xl border border-white/10 z-50">
                      <div className="px-3 py-1 text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                        Subtitles
                      </div>
                      <button
                        className={cn(
                          "w-full text-left px-4 py-1.5 text-sm hover:bg-white/10 hover:text-white",
                          !textTracks.some((t) => t.mode === "showing")
                            ? "text-primary font-medium"
                            : "text-white/80",
                        )}
                        onClick={() => {
                          textTracks.forEach((t) => (t.mode = "hidden"));
                          setShowSubMenu(false);
                        }}
                      >
                        Off
                      </button>
                      {textTracks.length > 0 ? (
                        textTracks.map((track, i) => (
                          <button
                            key={i}
                            className={cn(
                              "w-full text-left px-4 py-1.5 text-sm hover:bg-white/10 hover:text-white",
                              track.mode === "showing"
                                ? "text-primary font-medium"
                                : "text-white/80",
                            )}
                            onClick={() => {
                              textTracks.forEach((t) => (t.mode = "hidden"));
                              track.mode = "showing";
                              setShowSubMenu(false);
                            }}
                          >
                            {track.label || `Subtitle ${i + 1}`}{" "}
                            {track.language && `(${track.language})`}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-white/40">
                          No Subtitles
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={cn(
                    "hover:text-white transition-colors",
                    isShuffle ? "text-primary" : "text-white/70",
                  )}
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button
                  onClick={playPrevious}
                  className="text-white/90 hover:text-white"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/40 border border-primary/50 text-white flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  className="text-white/90 hover:text-white"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={cn(
                    "hover:text-white transition-colors",
                    isRepeat ? "text-primary" : "text-white/70",
                  )}
                >
                  <Repeat className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-5 text-white/70">
                <div className="flex items-center gap-2 group/vol hover:w-32 w-6 overflow-hidden transition-all duration-300">
                  <button
                    onClick={toggleMute}
                    className="shrink-0 hover:text-white"
                  >
                    {muted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 opacity-0 group-hover/vol:opacity-100 transition-opacity"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!isFullscreen) {
                      document.documentElement.requestFullscreen();
                      setIsFullscreen(true);
                    } else {
                      document.exitFullscreen();
                      setIsFullscreen(false);
                    }
                  }}
                  className="hover:text-white"
                  // Don't disable full screen toggle when locked so users can exit
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
