# AutoMusic

Welcome to the Music Generator App! This application allows users to input simple melodies using instruments like drums, piano, and guitar, and generates a complete and pleasant musical melody based on the input.

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Project Overview
The goal of this project is to create an application that accepts beginner-level inputs from instruments such as drums, piano, and guitar, and generates a complete musical melody based on those inputs.

## Features
- Input handling for multiple instruments (drums, piano, guitar).
- Melody generation based on the user's input.
- User-friendly interface for input and output.
- Export generated music to various formats (e.g., MP3, WAV).

## Installation
To get started with the Music Generator App, follow these steps:

1. **Clone the repository:**
    ```bash
    git clone https://github.com/MultinodeTECH/AutoMusic
    cd music-generator-app
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

## Usage
1. **Run the application:**
    ```bash
    python app.py
    ```

2. **Input your melodies:**
   - Use the provided user interface to input melodies using your preferred instruments.

3. **Generate and listen to the music:**
   - Click the 'Generate Music' button to create a complete musical melody based on your inputs.
   - Listen to the generated music through the app or export it to your preferred format.

## Technologies Used
- **Programming Language:** Python
- **Libraries:** 
  - MIDI library (e.g., `mido`)
  - Music generation library (e.g., `magenta`)
  - Audio processing tools (e.g., `pydub`)

## Contributing
We welcome contributions to the Music Generator App! To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
For questions or inquiries, please contact:

- **Name:** Harvey Hao
- **Email:** multinodetech@gmail.com
- **GitHub:** [MultinodeTECH](https://github.com/MultinodeTECH/AutoMusic)

Thank you for using the Music Generator App!
