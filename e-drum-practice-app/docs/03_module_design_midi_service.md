# Detailed Design: MIDI Service Module

## 1. Introduction

This document provides the detailed design for the **MIDI Service Module**. This module is responsible for all low-level interactions with the browser's Web MIDI API. It abstracts the complexity of MIDI handling, providing a clean, event-based interface for the rest of the application.

## 2. Module Responsibilities

*   Requesting MIDI access from the user.
*   Discovering and listing available MIDI input devices.
*   Managing the connection lifecycle of a MIDI device.
*   Listening for MIDI messages from the connected device.
*   Parsing raw MIDI data into a structured application-level event.
*   Publishing connection status and MIDI events to the global Event Bus.

## 3. Public API / Interface

The MIDI Service will be implemented as a JavaScript class or an object literal that exposes the following public methods.

```javascript
// Filename: midi_service.js

const MIDIService = {
    /**
     * Initializes the service. Must be called first, typically in response to a user action (e.g., a button click).
     * @returns {Promise<boolean>} A promise that resolves to true if MIDI access is granted, false otherwise.
     */
    async init() { /* ... */ },

    /**
     * Gets a list of available MIDI input devices.
     * @returns {Array<{id: string, name: string}>} An array of device objects.
     */
    getAvailableDevices() { /* ... */ },

    /**
     * Connects to a specific MIDI device by its ID.
     * @param {string} deviceId - The ID of the device to connect to.
     * @returns {Promise<boolean>} A promise that resolves to true on successful connection, false otherwise.
     */
    async connectToDevice(deviceId) { /* ... */ },

    /**
     * Disconnects from the currently connected device.
     */
    disconnect() { /* ... */ },
};
```

## 4. Internal State

The module will need to maintain the following internal state:

*   `midiAccess`: A reference to the `MIDIAccess` object provided by the Web MIDI API.
*   `connectedDevice`: A reference to the currently connected `MIDIInput` object.
*   `devices`: An array of all available MIDI input devices.
*   `connectionStatus`: A string representing the current status ('disconnected', 'connecting', 'connected').

## 5. Core Logic & Behavior

### 5.1. Initialization (`init`)
1.  Check if `navigator.requestMIDIAccess` exists. If not, the browser is incompatible; handle this error gracefully.
2.  Call `navigator.requestMIDIAccess()`. This will likely trigger a permission prompt for the user.
3.  On success:
    *   Store the `MIDIAccess` object in `this.midiAccess`.
    *   Populate `this.devices` by iterating through `midiAccess.inputs`.
    *   Set up a `statechange` event listener on `midiAccess` to handle devices being plugged in or out after initialization.
    *   Return `true`.
4.  On failure (user denies permission or other error):
    *   Log the error.
    *   Return `false`.

### 5.2. Device Connection (`connectToDevice`)
1.  Find the selected device in `this.devices` using the provided `deviceId`.
2.  If not found, reject the promise or return `false`.
3.  If a device is already connected, call `disconnect()` first.
4.  Set `this.connectionStatus` to 'connecting' and publish a `midi:connecting` event.
5.  Store the selected device object in `this.connectedDevice`.
6.  Attach a `midimessage` event listener to the `this.connectedDevice`.
7.  Set `this.connectionStatus` to 'connected' and publish a `midi:connected` event with the device name.
8.  Return `true`.

### 5.3. MIDI Message Handling (`onMIDIMessage`)
1.  This private method is the callback for the `midimessage` event listener.
2.  It receives a `MIDIMessageEvent` object. The raw MIDI data is in `event.data` (a `Uint8Array`).
3.  Parse `event.data`:
    *   The first byte contains the command and channel (e.g., `0x90` for Note On on channel 1).
    *   The second byte is the note number (e.g., `36` for a kick drum).
    *   The third byte is the velocity (0-127).
4.  We are primarily interested in "Note On" messages (command `0x9`). A Note On with velocity 0 is often treated as a "Note Off".
5.  If the message is a valid Note On (command `0x9` and velocity > 0):
    *   Create a structured data object: `{ note: noteNumber, velocity: velocity, type: 'noteOn' }`.
    *   Publish this object to the Event Bus via `eventBus.publish('midi:noteOn', parsedData)`.

### 5.4. Disconnection (`disconnect`)
1.  If `this.connectedDevice` is not null:
    *   Remove the `midimessage` event listener from it.
    *   Set `this.connectedDevice` to `null`.
    *   Set `this.connectionStatus` to 'disconnected'.
    *   Publish a `midi:disconnected` event.

## 6. Events Published to Event Bus

*   **`midi:connecting`**: Published when a connection attempt begins.
    *   Payload: `{ deviceId: string }`
*   **`midi:connected`**: Published when a connection is successfully established.
    *   Payload: `{ deviceId: string, deviceName: string }`
*   **`midi:disconnected`**: Published when the device is disconnected.
    *   Payload: `null`
*   **`midi:noteOn`**: Published when a drum pad is hit.
    *   Payload: `{ note: number, velocity: number, type: 'noteOn' }`

## 7. Error Handling

*   The module must handle the case where the browser does not support the Web MIDI API.
*   It must handle the user denying permission for MIDI access.
*   It must gracefully handle a connected device being physically unplugged (via the `statechange` event).