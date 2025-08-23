# Detailed Design: MIDI Generator Module

## 1. Introduction

This document provides the detailed design for the **MIDI Generator Module**. Following the updated system architecture, this module is no longer a direct-to-JSON formatter. Instead, it serves a more crucial, intermediate role: converting the raw, classified onset data into a standard MIDI file. This MIDI file acts as a universal, musically-aware format that decouples the transcription process from the final score generation.

## 2. Module Responsibilities

*   Accept a list of classified onsets (timestamps and instrument labels) and an estimated BPM.
*   Map instrument labels to their corresponding General MIDI (GM) note numbers for percussion (Channel 10).
*   Create a well-formed MIDI data structure containing a single track with all the drum notes.
*   Encode the tempo (BPM) information into the MIDI file.
*   Provide a method to save the MIDI data to a file (`.mid`).

## 3. Public API / Interface

This module can be implemented as a class to manage the MIDI creation process.

```python
# Filename: midi_generator.py
from mido import Message, MetaMessage, MidiFile, MidiTrack
from typing import List, Dict, Any

class MidiGenerator:
    def __init__(self, classified_onsets: List[Dict[str, Any]], bpm: float):
        """
        Initializes the generator with the necessary data.
        'classified_onsets' is a list of dicts, e.g., [{'time': 1.23, 'instrument': 'kick'}, ...]
        """
        # ...

    def generate_midi_file(self) -> MidiFile:
        """
        Generates the final Mido MidiFile object.
        """
        # ...

    def save_to_file(self, output_path: str):
        """
        Saves the generated MIDI data to a .mid file.
        """
        # ...
```

## 4. Core Logic & Behavior

### 4.1. `__init__`
1.  **Store Inputs:** Store the `classified_onsets` and `bpm`.
2.  **Sort Onsets:** Ensure the onsets are sorted by time, as this is crucial for correct MIDI delta time calculation. `self.classified_onsets.sort(key=lambda x: x['time'])`.
3.  **Define MIDI Map:** Define the mapping from instrument labels to GM MIDI note numbers for percussion.
    ```python
    self.instrument_to_midi = {
        'kick': 36,
        'snare': 38,
        'hihat': 42,
        # Add more mappings as the classifier improves
    }
    ```

### 4.2. `generate_midi_file`
1.  **Initialize MIDI File:** Create a new `MidiFile` (type 1) and a `MidiTrack`.
    *   `mid = MidiFile(type=1)`
    *   `track = MidiTrack()`
    *   `mid.tracks.append(track)`
2.  **Set Tempo:** Add a tempo meta-message to the track. The tempo is specified in microseconds per beat.
    *   `microseconds_per_beat = mido.bpm2tempo(self.bpm)`
    *   `track.append(MetaMessage('set_tempo', tempo=microseconds_per_beat))`
3.  **Add Notes:** Iterate through the sorted `classified_onsets`.
    *   **Delta Time:** For each note, the most important value is the *delta time*—the time elapsed *since the previous event*.
    *   Keep track of the `last_event_time_seconds`.
    *   For each `onset`:
        a.  `current_time_seconds = onset['time']`
        b.  `delta_seconds = current_time_seconds - last_event_time_seconds`
        c.  Convert `delta_seconds` to MIDI ticks. `ticks_per_beat` is a property of the `MidiFile` (default is 480). `delta_ticks = mido.second2tick(delta_seconds, mid.ticks_per_beat, self.bpm)`.
        d.  Look up the MIDI note number from `self.instrument_to_midi`. If not found, skip it.
        e.  Create the MIDI messages. For drums, a short duration is fine. We'll use a fixed velocity (e.g., 100).
            *   `track.append(Message('note_on', note=midi_note, velocity=100, time=round(delta_ticks), channel=9))`
            *   `track.append(Message('note_off', note=midi_note, velocity=0, time=30, channel=9))`  *(A small, non-zero time for the note duration)*
        f.  Update `last_event_time_seconds = current_time_seconds`.
4.  **Return:** Return the completed `mid` object.

### 4.3. `save_to_file`
1.  Call `self.generate_midi_file()` to get the final `MidiFile` object.
2.  Use the object's built-in save method: `midi_file.save(output_path)`.

## 5. Data Structures

*   **Input (`classified_onsets`):** A list of dictionaries, `{'time': float_seconds, 'instrument': 'string_label'}`.
*   **Output:** A `mido.MidiFile` object, which can be saved to a standard `.mid` file.