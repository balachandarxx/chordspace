# ChordSpace 🎼

**ChordSpace** is a browser-based spatial musical instrument that lets you play chords and conduct a virtual orchestra using your hands through a webcam.

No MIDI controller or special hardware is required — just a browser and camera.

## How It Works

ChordSpace tracks two hands using computer vision.

### 🎹 Chord Hand

Move your index finger around the connected six-part chord wheel.

- Each sector plays a chord in the selected key
- Slide directly between connected chord regions
- Move into the centre **Neutral** zone to stop the chord
- Choose either your left or right hand as the chord hand
- Supports all 12 major keys

### 🎻 Conductor Hand

Your second hand controls the orchestra.

#### Finger Count = Orchestra Size

| Fingers | Orchestra |
| --- | --- |
| 0 | Silence |
| 1 | Piano |
| 2 | Piano + Sustained Strings |
| 3 | + Cello Pizzicato |
| 4 | + Violin Spiccato + French Horn |
| 5 | + Violin Tremolo |

The orchestra progressively grows as more fingers are raised.

#### Hand Height = Dynamics

The vertical position of the conductor hand controls musical intensity.

- Lower hand → softer
- Middle position → normal
- Higher hand → stronger
- Movement is smoothed to create continuous volume swells

This allows orchestra size and musical dynamics to be controlled independently.

## Two-Hand Safety

ChordSpace only produces sound when both the chord hand and conductor hand are detected.

If the conductor hand disappears, the orchestra immediately stops and resets to silence.

This prevents accidental playback when only the chord hand is visible.

## Features

- Webcam-based hand tracking
- Real-time gesture interaction
- 12 major keys
- Six diatonic chord regions
- Large connected spatial chord wheel
- Smooth movement between chords
- Neutral centre zone for silence
- Real orchestral sample playback
- Dynamic orchestra layering
- Finger-count gesture recognition
- Conductor-style dynamics using hand height
- Left or right chord-hand selection
- Two-hand safety system
- Runs directly in the browser

## Orchestra Design

ChordSpace is designed so that each level expands the same virtual orchestra rather than switching between unrelated sounds.

### Level 1 — Harmony

**Piano**

Provides the main chord and harmonic foundation.

### Level 2 — Warmth

**Piano + Sustained Violin & Viola**

Adds sustained string harmony and width.

### Level 3 — Rhythm

**+ Cello Pizzicato**

Adds a repeating low-string pulse using alternating recorded samples for a more natural sound.

### Level 4 — Motion

**+ Violin Spiccato + French Horn**

Short violin articulations introduce movement while the horn strengthens the harmonic foundation.

### Level 5 — Intensity

**+ Violin Tremolo**

Adds a more energetic string texture to create the fullest orchestral level.

## Technology

ChordSpace is built with:

- **React**
- **TypeScript**
- **Vite**
- **MediaPipe Tasks Vision**
- **Tone.js**
- **Web Audio API**

MediaPipe is used for real-time hand landmark detection, while Tone.js and the Web Audio API handle orchestral sample playback and audio control.

## Running Locally

Clone the repository:

```bash
git clone https://github.com/balachandarxx/chordspace.git
```

Enter the project:

```bash
cd chordspace
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will display a local URL such as:

```text
http://localhost:5173/
```

Open the URL shown in your terminal.

Then:

1. Click **Enter ChordSpace**
2. Allow camera access
3. Show both hands
4. Use one hand to select chords
5. Use the other hand to conduct the orchestra

## Camera & Privacy

ChordSpace requires webcam permission for real-time hand tracking.

Camera processing is performed in the browser.

ChordSpace does not intentionally record, store, or upload webcam video.

## Inspiration & Credits

### Gesture Synth

ChordSpace was inspired in part by [Gesture Synth by Ekmand](https://github.com/Ekmand/gesture-synth), a browser-based hand-tracking musical instrument exploring webcam gestures for real-time musical control.

ChordSpace is an independent implementation that develops the concept in a different direction, with a focus on:

- a connected spatial chord wheel
- two-hand interaction
- finger-count orchestra layering
- conductor-style dynamic control
- progressive orchestral arrangement
- real orchestral sample playback

Thanks to the Gesture Synth project and its creator for the inspiration.

### Orchestral Samples

ChordSpace uses orchestral recordings from the [VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE) sample library.

The recordings used in ChordSpace have been curated and processed for use within the instrument.

Please refer to the original VSCO 2 Community Edition repository for its licensing information and details about the sample library.

## Project Status

ChordSpace is currently an experimental project and is actively being developed.

Current and future areas of development include:

- smoother transitions between chords
- improved orchestral realism
- more expressive conductor controls
- improved hand-tracking stability
- performance optimisation
- interface and visual polish
- expanded musical controls
- public browser deployment

## Author

Built by **Bala Chandar**.

---

**ChordSpace — Reach into music.**