# Data Format: Drum Score JSON

## 1. Introduction

This document defines the structure of the JSON format used to represent drum scores within the E-Drum Practice App. The format is designed to be simple to parse, easy to create manually for testing, and extensible for future features.

## 2. JSON Structure

A drum score file will be a JSON object with two main properties: `metadata` and `notes`.

```json
{
  "metadata": {
    "title": "Basic Rock Beat 1",
    "artist": "Practice App",
    "bpm": 120,
    "duration": 8000,
    "difficulty": "Beginner"
  },
  "notes": [
    { "time": 0, "note": 36 },
    { "time": 500, "note": 42 },
    { "time": 1000, "note": 38 },
    { "time": 1500, "note": 42 },
    { "time": 2000, "note": 36 },
    { "time": 2500, "note": 42 },
    { "time": 3000, "note": 38 },
    { "time": 3500, "note": 42 }
  ]
}
```

## 3. Property Definitions

### 3.1. `metadata` (Object)

This object contains general information about the score.

*   **`title` (string, required):** The name of the song or exercise.
*   **`artist` (string, optional):** The artist name.
*   **`bpm` (number, required):** Beats Per Minute. This is the primary tempo for the score. The Game Engine will use this to synchronize the score's timing, although the `time` property of each note is the ultimate source of truth.
*   **`duration` (number, required):** The total duration of the score in milliseconds. This helps the application know when the song is finished.
*   **`difficulty` (string, optional):** A descriptive difficulty level (e.g., "Beginner", "Intermediate", "Expert").

### 3.2. `notes` (Array of Objects)

This is an array containing all the note events in the score. The array should be **pre-sorted** by the `time` property in ascending order to allow for efficient processing by the Game Engine.

Each object in the `notes` array represents a single drum hit and has the following properties:

*   **`time` (number, required):** The absolute time in milliseconds from the beginning of the score when this note should be hit. `0` represents the very start.
*   **`note` (number, required):** The MIDI note number that corresponds to the drum pad to be hit. This will follow the General MIDI (GM) standard drum map.

#### Common MIDI Note Numbers (GM Standard)
*   `36`: Kick Drum
*   `38`: Snare Drum
*   `42`: Closed Hi-Hat
*   `46`: Open Hi-Hat
*   `49`: Crash Cymbal 1
*   `51`: Ride Cymbal 1
*   `48`: High Tom
*   `45`: Low Tom
*   `43`: Floor Tom

## 4. Example File (`basic_rock.json`)

Here is a complete example of a simple, 2-bar rock beat at 120 BPM. Each beat is 500ms apart.

```json
{
  "metadata": {
    "title": "Basic 4/4 Rock Beat",
    "artist": "System",
    "bpm": 120,
    "duration": 4000,
    "difficulty": "Beginner"
  },
  "notes": [
    // Bar 1
    { "time": 0, "note": 36 },     // Beat 1: Kick
    { "time": 0, "note": 42 },     // Beat 1: Hi-Hat
    { "time": 500, "note": 42 },    // Beat 1.5: Hi-Hat
    { "time": 1000, "note": 38 },   // Beat 2: Snare
    { "time": 1000, "note": 42 },   // Beat 2: Hi-Hat
    { "time": 1500, "note": 42 },   // Beat 2.5: Hi-Hat
    { "time": 2000, "note": 36 },   // Beat 3: Kick
    { "time": 2000, "note": 42 },   // Beat 3: Hi-Hat
    { "time": 2500, "note": 42 },   // Beat 3.5: Hi-Hat
    { "time": 3000, "note": 38 },   // Beat 4: Snare
    { "time": 3000, "note": 42 },   // Beat 4: Hi-Hat
    { "time": 3500, "note": 42 }    // Beat 4.5: Hi-Hat
  ]
}
```

## 5. Future Extensibility

This format can be easily extended in the future. For example, to support varying velocities or different note types (e.g., accents, flams), we could add more properties to the note objects:

```json
// Future example
{
  "time": 1000,
  "note": 38,
  "velocity": 127, // For dynamics
  "type": "accent"   // For special markings
}
```
For the MVP, only `time` and `note` are required.