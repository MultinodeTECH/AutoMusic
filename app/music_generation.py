"""
Music generation module using AudioCraft framework.
This module handles the AI-powered music generation and processing.
"""

import torch
import torchaudio
from typing import Dict, Optional, Union, List
import numpy as np
from audiocraft.models import MusicGen, AudioGen
from audiocraft.data.audio import audio_write

class MusicGenerator:
    """
    Handles music generation using AudioCraft's models.
    Supports both MusicGen and AudioGen for different audio generation tasks.
    """
    
    def __init__(self, model_size: str = 'medium'):
        """
        Initialize the music generator with specified model.
        
        Args:
            model_size (str): Size of the model to use ('small', 'medium', 'large')
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.music_model = MusicGen.get_pretrained(model_size).to(self.device)
        self.audio_model = AudioGen.get_pretrained('base').to(self.device)
        
    def generate_from_audio(
        self,
        input_audio: np.ndarray,
        duration: float = 30.0,
        prompt: Optional[str] = None,
        temperature: float = 1.0
    ) -> np.ndarray:
        """
        Generate music based on input audio and optional text prompt.
        
        Args:
            input_audio (np.ndarray): Input audio array
            duration (float): Duration of generated music in seconds
            prompt (Optional[str]): Text description for music generation
            temperature (float): Sampling temperature (higher = more random)
            
        Returns:
            np.ndarray: Generated audio data
        """
        # Convert numpy array to tensor
        audio_tensor = torch.from_numpy(input_audio).float().to(self.device)
        
        # Set generation parameters
        self.music_model.set_generation_params(
            duration=duration,
            temperature=temperature
        )
        
        # Generate music
        if prompt:
            output = self.music_model.generate_with_chroma(
                descriptions=[prompt],
                melody_wavs=audio_tensor.unsqueeze(0),
                progress=True
            )
        else:
            output = self.music_model.generate_continuation(
                prompt=audio_tensor.unsqueeze(0),
                progress=True
            )
        
        return output.cpu().numpy()
    
    def enhance_audio(
        self,
        audio_data: np.ndarray,
        sample_rate: int = 44100
    ) -> np.ndarray:
        """
        Enhance audio quality using AudioCraft's models.
        
        Args:
            audio_data (np.ndarray): Input audio data
            sample_rate (int): Audio sample rate
            
        Returns:
            np.ndarray: Enhanced audio data
        """
        # Convert to tensor
        audio_tensor = torch.from_numpy(audio_data).float().to(self.device)
        
        # Process through EnCodec
        with torch.no_grad():
            enhanced = self.music_model.compression_model.encode(audio_tensor)
            enhanced = self.music_model.compression_model.decode(enhanced)
        
        return enhanced.cpu().numpy()
    
    def generate_accompaniment(
        self,
        processed_input: Dict[str, Union[np.ndarray, Dict]],
        style: str = 'rock',
        duration: float = 30.0
    ) -> Dict[str, np.ndarray]:
        """
        Generate accompaniment for processed instrument inputs.
        
        Args:
            processed_input (Dict): Processed input from different instruments
            style (str): Music style to generate
            duration (float): Duration of generated music
            
        Returns:
            Dict[str, np.ndarray]: Generated accompaniment tracks
        """
        accompaniment = {}
        
        # Generate drum accompaniment if needed
        if 'drums' not in processed_input:
            prompt = f"Generate {style} style drum pattern"
            drums = self.audio_model.generate([prompt], duration=duration)
            accompaniment['drums'] = drums.cpu().numpy()
        
        # Generate bass line
        bass_prompt = f"Generate {style} style bass line"
        bass = self.music_model.generate([bass_prompt], duration=duration)
        accompaniment['bass'] = bass.cpu().numpy()
        
        return accompaniment

def generate_music(processed_input: Dict[str, Union[np.ndarray, Dict]]) -> np.ndarray:
    """
    Main function to generate music from processed inputs.
    
    Args:
        processed_input (Dict): Processed input from different instruments
        
    Returns:
        np.ndarray: Generated music data
    """
    generator = MusicGenerator()
    
    # Combine all input audio
    combined_input = np.zeros(0)
    for instrument, data in processed_input.items():
        if isinstance(data, np.ndarray):
            combined_input = np.concatenate([combined_input, data])
        elif isinstance(data, dict) and 'audio' in data:
            combined_input = np.concatenate([combined_input, data['audio']])
    
    # Generate main music track
    generated_music = generator.generate_from_audio(
        combined_input,
        prompt="Create a full arrangement based on the input",
        duration=60.0
    )
    
    # Generate accompaniment
    accompaniment = generator.generate_accompaniment(processed_input)
    
    # Mix all tracks (simple mixing)
    final_mix = generated_music * 0.7  # Main track
    for track in accompaniment.values():
        final_mix += track * 0.3  # Accompaniment tracks
    
    # Normalize the final mix
    final_mix = final_mix / np.max(np.abs(final_mix))
    
    return final_mix
