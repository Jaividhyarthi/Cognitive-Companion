import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Play, Pause, SkipForward, Volume2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function MusicPlayer({ onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/music/playlists`);
      setPlaylists(res.data);
      if (res.data.length > 0) {
        setCurrentPlaylist(res.data[0]);
        if (res.data[0].tracks?.length > 0) {
          setCurrentTrack(res.data[0].tracks[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (currentTrack?.preview_url && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const skipTrack = () => {
    if (!currentPlaylist?.tracks?.length) return;
    const nextIndex = (currentTrackIndex + 1) % currentPlaylist.tracks.length;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(currentPlaylist.tracks[nextIndex]);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const selectPlaylist = (playlist) => {
    setCurrentPlaylist(playlist);
    setCurrentTrackIndex(0);
    if (playlist.tracks?.length > 0) {
      setCurrentTrack(playlist.tracks[0]);
    }
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const albumArt = currentTrack?.album_art || currentPlaylist?.image || 
    'https://images.unsplash.com/photo-1686519093104-3140c6dcf284?w=200&h=200&fit=crop';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface-elevated border-t border-white/10 p-4 md:p-6 z-40">
      <button
        data-testid="music-player-close-btn"
        onClick={onClose}
        className="absolute top-3 right-3 p-2 hover:bg-background rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {currentTrack?.preview_url && (
        <audio ref={audioRef} src={currentTrack.preview_url} onEnded={skipTrack} />
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 md:gap-6">
          <img
            src={albumArt}
            alt={currentTrack?.title || 'Album art'}
            className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-heading truncate">{currentTrack?.title || 'No track selected'}</h3>
            <p className="text-sm text-slate-400 truncate">{currentTrack?.artist || 'Select a playlist'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{currentPlaylist?.name}</span>
              {currentPlaylist?.source && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  currentPlaylist.source === 'spotify' ? 'bg-green-500/20 text-green-400' :
                  currentPlaylist.source === 'youtube' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {currentPlaylist.source}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              data-testid="music-player-play-btn"
              onClick={togglePlay}
              size="icon"
              className="bg-primary hover:bg-primary-hover text-white w-10 h-10 md:w-12 md:h-12 rounded-full"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              data-testid="music-player-skip-btn"
              onClick={skipTrack}
              size="icon"
              variant="outline"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            {currentTrack?.external_url && (
              <a
                data-testid="music-player-external-link"
                href={currentTrack.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-background rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3 w-32">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <Slider
              data-testid="volume-slider"
              value={[volume]}
              onValueChange={(val) => setVolume(val[0])}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {playlists.map(playlist => (
            <button
              key={playlist.id}
              data-testid={`playlist-${playlist.id}-btn`}
              onClick={() => selectPlaylist(playlist)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                currentPlaylist?.id === playlist.id
                  ? 'bg-primary text-white'
                  : 'bg-background text-slate-400 hover:bg-slate-700'
              }`}
            >
              {playlist.name}
            </button>
          ))}
        </div>

        {currentTrack?.embed_url && isPlaying && (
          <div className="mt-3">
            <iframe
              src={`${currentTrack.embed_url}?autoplay=1`}
              title={currentTrack.title}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              className="rounded-lg"
            />
          </div>
        )}

        {!currentTrack?.preview_url && !currentTrack?.embed_url && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            {currentTrack?.external_url 
              ? 'Click the external link to listen on the original platform.'
              : 'Preview not available for this track.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default MusicPlayer;
