# AutoMusic

Welcome to AutoMusic! This application is designed to generate complete musical melodies based on simple instrumental inputs using advanced AI technology, powered by Meta's AudioCraft framework.

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [AudioCraft Integration](#audiocraft-integration)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Project Overview
AutoMusic is an innovative application that leverages AI to transform basic musical inputs into complete, harmonious compositions. The project aims to make music creation more accessible by allowing users to input simple melodies through various instruments and having AI enhance and complete the composition. It utilizes Meta's AudioCraft framework for high-quality music generation and processing.

## Features
Current Implementation:
- Real-time audio input processing for electronic drums and guitar
- Advanced audio signal processing using librosa
- Core music generation framework using AudioCraft AI
- Output handling and file saving capabilities
- Audio normalization and enhancement
- Component-based drum pattern recognition
- Guitar pitch and rhythm extraction

Planned Features:
- Web-based user interface for easy interaction
- Real-time input recording with visual feedback
- Multiple export formats (MP3, WAV, MIDI)
- Advanced AI-driven music generation with style transfer
- Custom instrument support and profile creation
- Multi-track recording and mixing capabilities
- Real-time audio effects and processing

## Project Structure
```
AutoMusic/
├── app/
│   ├── __init__.py
│   ├── input_processing.py  - Handles instrument input processing
│   ├── main.py             - Main application entry point
│   ├── music_generation.py - Core music generation logic
│   └── output_handling.py  - Manages output file handling
├── audiocraft/             - AI model components and utilities
│   ├── models/            - Neural network model definitions
│   ├── data/             - Dataset handling and preprocessing
│   ├── modules/          - Core AudioCraft components
│   └── utils/            - Utility functions and helpers
├── tests/                  - Test suite
├── requirements.txt        - Project dependencies
└── README.md              - Project documentation
```

## Installation
1. **Clone the repository:**
    ```bash
    git clone https://github.com/MultinodeTECH/AutoMusic.git
    cd AutoMusic
    ```

2. **Create and activate a virtual environment:**
    ```bash
    python -m venv env
    source env/bin/activate  # On Windows, use `env\Scripts\activate`
    ```

3. **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4. **Install additional audio drivers (if needed):**
    - For Linux: `sudo apt-get install portaudio19-dev`
    - For macOS: `brew install portaudio`
    - For Windows: No additional drivers needed

## Usage
Currently, the application supports both command-line and programmatic usage:

1. **Run the application:**
    ```bash
    python -m app.main
    ```

2. **Record from instruments:**
    ```python
    from app.input_processing import AudioInputProcessor
    
    # Initialize processor
    processor = AudioInputProcessor()
    
    # Record drums (5 seconds)
    drum_audio = processor.start_recording(duration=5.0)
    processed_drums = processor.process_drums(drum_audio)
    
    # Record guitar (10 seconds)
    guitar_audio = processor.start_recording(duration=10.0)
    pitches, beats = processor.process_guitar(guitar_audio)
    ```

## AudioCraft Integration
AutoMusic leverages Meta's AudioCraft framework for advanced music generation and processing:

- **MusicGen Model**: Generates high-quality music from text descriptions and audio prompts
- **EnCodec**: Handles high-quality audio compression and processing
- **AudioGen**: Generates environmental sounds and effects
- **Custom Training**: Supports fine-tuning on your own music collection

Key features of AudioCraft integration:
- High-quality music generation from instrument inputs
- Style transfer and genre adaptation
- Multi-instrument track separation and mixing
- Real-time audio processing and enhancement

## Technologies Used
- **Core Technologies:**
  - Python 3.x
  - Flask (Web Framework)
  
- **Music Processing:**
  - Mido (MIDI handling)
  - Magenta (Music generation)
  - Pydub (Audio processing)

- **Development Tools:**
  - Git (Version control)
  - Virtual Environment (Python venv)

## Contributing
We welcome contributions to AutoMusic! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please ensure your code follows our coding standards and includes appropriate tests.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
For questions, suggestions, or collaboration:

- **Developer:** Harvey Hao
- **Email:** multinodetech@gmail.com
- **GitHub:** [MultinodeTECH](https://github.com/MultinodeTECH/AutoMusic)

---
Project Status: Under active development - Contributors welcome!
