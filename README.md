# ChordSpace 🎼

**ChordSpace** is a browser-based spatial musical instrument that lets you play chords and conduct a virtual orchestra using your hands through a webcam.

No MIDI controller or special hardware is required — just a browser and camera.

## How it works

ChordSpace tracks two hands using computer vision.

### Chord Hand
Move your index finger around the six-part chord wheel.

- Each sector plays a chord in the selected key
- Slide directly between connected chord regions
- Move into the centre **Neutral** zone to stop the chord
- Choose either the left or right hand as the chord hand

### Conductor Hand

Your second hand controls the orchestra.

**Finger count controls orchestra size:**

| Fingers | Orchestra |
|---|---|
| 0 | Silence |
| 1 | Piano |
| 2 | Piano + Sustained Strings |
| 3 | + Cello Pizzicato |
| 4 | + Violin Spiccato + French Horn |
| 5 | + Violin Tremolo |

**Hand height controls dynamics:**

- Lower hand → softer
- Higher hand → stronger
- Movement is smoothed to create continuous swells

Both hands must be visible for sound to play.

## Features

- Webcam-based hand tracking
- 12 major keys
- Six diatonic chord regions
- Continuous connected chord wheel
- Real orchestral sample playback
- Dynamic orchestra layering
- Finger-count gesture recognition
- Conductor-style dynamic control
- Two-hand safety system
- Runs entirely in the browser

## Technology

- React
- TypeScript
- Vite
- MediaPipe Tasks Vision
- Tone.js
- Web Audio API

## Running locally

Clone the repository:

```bash
git clone https://github.com/balachandarxx/chordspace.git