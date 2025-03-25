"""
Output handling module for saving and exporting generated music.
Supports multiple output formats and quality settings.
"""

import numpy as np
import soundfile as sf
from typing import Optional
import os
from datetime import datetime

class AudioOutputHandler:
    """
    Handles the saving and exporting of generated audio in various formats.
    """
    
    def __init__(self, output_dir: str = "output"):
        """
        Initialize the output handler.
        
        Args:
            output_dir (str): Directory to save output files
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def save_wav(
        self,
        audio_data: np.ndarray,
        filename: Optional[str] = None,
        sample_rate: int = 44100
    ) -> str:
        """
        Save audio data as WAV file.
        
        Args:
            audio_data (np.ndarray): Audio data to save
            filename (Optional[str]): Output filename
            sample_rate (int): Audio sample rate
            
        Returns:
            str: Path to saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"generated_{timestamp}.wav"
        
        filepath = os.path.join(self.output_dir, filename)
        sf.write(filepath, audio_data, sample_rate)
        return filepath
    
    def save_mp3(
        self,
        audio_data: np.ndarray,
        filename: Optional[str] = None,
        sample_rate: int = 44100,
        bitrate: str = "320k"
    ) -> str:
        """
        Save audio data as MP3 file.
        
        Args:
            audio_data (np.ndarray): Audio data to save
            filename (Optional[str]): Output filename
            sample_rate (int): Audio sample rate
            bitrate (str): MP3 bitrate
            
        Returns:
            str: Path to saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"generated_{timestamp}.mp3"
        
        # First save as WAV
        wav_path = self.save_wav(audio_data, "temp.wav", sample_rate)
        
        # Convert to MP3 using pydub
        from pydub import AudioSegment
        audio = AudioSegment.from_wav(wav_path)
        
        mp3_path = os.path.join(self.output_dir, filename)
        audio.export(mp3_path, format="mp3", bitrate=bitrate)
        
        # Clean up temporary WAV file
        os.remove(wav_path)
        
        return mp3_path
    
    def save_midi(
        self,
        midi_data: bytes,
        filename: Optional[str] = None
    ) -> str:
        """
        Save MIDI data to file.
        
        Args:
            midi_data (bytes): MIDI data to save
            filename (Optional[str]): Output filename
            
        Returns:
            str: Path to saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"generated_{timestamp}.mid"
        
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(midi_data)
        
        return filepath

def save_output(
    generated_music: np.ndarray,
    format: str = "wav",
    filename: Optional[str] = None,
    sample_rate: int = 44100
) -> str:
    """
    Save generated music to file.
    
    Args:
        generated_music (np.ndarray): Generated music data
        format (str): Output format ("wav", "mp3", or "midi")
        filename (Optional[str]): Output filename
        sample_rate (int): Audio sample rate
        
    Returns:
        str: Path to saved file
    """
    handler = AudioOutputHandler()
    
    if format.lower() == "wav":
        return handler.save_wav(generated_music, filename, sample_rate)
    elif format.lower() == "mp3":
        return handler.save_mp3(generated_music, filename, sample_rate)
    elif format.lower() == "midi":
        raise NotImplementedError("MIDI export not yet implemented")
    else:
        raise ValueError(f"Unsupported format: {format}")
