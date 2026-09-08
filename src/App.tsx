import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import * as Tone from "tone";

import "./App.css";

/* =========================================================
   TYPES
   ========================================================= */

type PlayingHand = "left" | "right";

type Point = {
  x: number;
  y: number;
  z?: number;
};

type Chord = {
  name: string;
  notes: string[];
};

type PositionedChord = Chord & {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

type KeyData = {
  label: string;
  chords: Chord[];
};

type DetectedHand = {
  index: number;
  landmarks: Point[];
  palm: Point;
};

type HandResults = {
  landmarks: Point[][];
};

/* =========================================================
   KEY DATA
   ========================================================= */

const KEY_DATA: Record<string, KeyData> = {
  C: {
    label: "C Major",
    chords: [
      { name: "C", notes: ["C4", "E4", "G4"] },
      { name: "Dm", notes: ["D4", "F4", "A4"] },
      { name: "Em", notes: ["E4", "G4", "B4"] },
      { name: "F", notes: ["F4", "A4", "C5"] },
      { name: "G", notes: ["G4", "B4", "D5"] },
      { name: "Am", notes: ["A4", "C5", "E5"] },
    ],
  },

  Db: {
    label: "D♭ Major",
    chords: [
      { name: "D♭", notes: ["Db4", "F4", "Ab4"] },
      { name: "E♭m", notes: ["Eb4", "Gb4", "Bb4"] },
      { name: "Fm", notes: ["F4", "Ab4", "C5"] },
      { name: "G♭", notes: ["Gb4", "Bb4", "Db5"] },
      { name: "A♭", notes: ["Ab4", "C5", "Eb5"] },
      { name: "B♭m", notes: ["Bb4", "Db5", "F5"] },
    ],
  },

  D: {
    label: "D Major",
    chords: [
      { name: "D", notes: ["D4", "F#4", "A4"] },
      { name: "Em", notes: ["E4", "G4", "B4"] },
      { name: "F♯m", notes: ["F#4", "A4", "C#5"] },
      { name: "G", notes: ["G4", "B4", "D5"] },
      { name: "A", notes: ["A4", "C#5", "E5"] },
      { name: "Bm", notes: ["B4", "D5", "F#5"] },
    ],
  },

  Eb: {
    label: "E♭ Major",
    chords: [
      { name: "E♭", notes: ["Eb4", "G4", "Bb4"] },
      { name: "Fm", notes: ["F4", "Ab4", "C5"] },
      { name: "Gm", notes: ["G4", "Bb4", "D5"] },
      { name: "A♭", notes: ["Ab4", "C5", "Eb5"] },
      { name: "B♭", notes: ["Bb4", "D5", "F5"] },
      { name: "Cm", notes: ["C5", "Eb5", "G5"] },
    ],
  },

  E: {
    label: "E Major",
    chords: [
      { name: "E", notes: ["E4", "G#4", "B4"] },
      { name: "F♯m", notes: ["F#4", "A4", "C#5"] },
      { name: "G♯m", notes: ["G#4", "B4", "D#5"] },
      { name: "A", notes: ["A4", "C#5", "E5"] },
      { name: "B", notes: ["B4", "D#5", "F#5"] },
      { name: "C♯m", notes: ["C#5", "E5", "G#5"] },
    ],
  },

  F: {
    label: "F Major",
    chords: [
      { name: "F", notes: ["F4", "A4", "C5"] },
      { name: "Gm", notes: ["G4", "Bb4", "D5"] },
      { name: "Am", notes: ["A4", "C5", "E5"] },
      { name: "B♭", notes: ["Bb4", "D5", "F5"] },
      { name: "C", notes: ["C5", "E5", "G5"] },
      { name: "Dm", notes: ["D5", "F5", "A5"] },
    ],
  },

  Gb: {
    label: "G♭ Major",
    chords: [
      { name: "G♭", notes: ["Gb4", "Bb4", "Db5"] },
      { name: "A♭m", notes: ["Ab4", "B4", "Eb5"] },
      { name: "B♭m", notes: ["Bb4", "Db5", "F5"] },
      { name: "C♭", notes: ["B4", "Eb5", "Gb5"] },
      { name: "D♭", notes: ["Db5", "F5", "Ab5"] },
      { name: "E♭m", notes: ["Eb5", "Gb5", "Bb5"] },
    ],
  },

  G: {
    label: "G Major",
    chords: [
      { name: "G", notes: ["G4", "B4", "D5"] },
      { name: "Am", notes: ["A4", "C5", "E5"] },
      { name: "Bm", notes: ["B4", "D5", "F#5"] },
      { name: "C", notes: ["C5", "E5", "G5"] },
      { name: "D", notes: ["D5", "F#5", "A5"] },
      { name: "Em", notes: ["E5", "G5", "B5"] },
    ],
  },

  Ab: {
    label: "A♭ Major",
    chords: [
      { name: "A♭", notes: ["Ab4", "C5", "Eb5"] },
      { name: "B♭m", notes: ["Bb4", "Db5", "F5"] },
      { name: "Cm", notes: ["C5", "Eb5", "G5"] },
      { name: "D♭", notes: ["Db5", "F5", "Ab5"] },
      { name: "E♭", notes: ["Eb5", "G5", "Bb5"] },
      { name: "Fm", notes: ["F5", "Ab5", "C6"] },
    ],
  },

  A: {
    label: "A Major",
    chords: [
      { name: "A", notes: ["A4", "C#5", "E5"] },
      { name: "Bm", notes: ["B4", "D5", "F#5"] },
      { name: "C♯m", notes: ["C#5", "E5", "G#5"] },
      { name: "D", notes: ["D5", "F#5", "A5"] },
      { name: "E", notes: ["E5", "G#5", "B5"] },
      { name: "F♯m", notes: ["F#5", "A5", "C#6"] },
    ],
  },

  Bb: {
    label: "B♭ Major",
    chords: [
      { name: "B♭", notes: ["Bb4", "D5", "F5"] },
      { name: "Cm", notes: ["C5", "Eb5", "G5"] },
      { name: "Dm", notes: ["D5", "F5", "A5"] },
      { name: "E♭", notes: ["Eb5", "G5", "Bb5"] },
      { name: "F", notes: ["F5", "A5", "C6"] },
      { name: "Gm", notes: ["G5", "Bb5", "D6"] },
    ],
  },

  B: {
    label: "B Major",
    chords: [
      { name: "B", notes: ["B4", "D#5", "F#5"] },
      { name: "C♯m", notes: ["C#5", "E5", "G#5"] },
      { name: "D♯m", notes: ["D#5", "F#5", "A#5"] },
      { name: "E", notes: ["E5", "G#5", "B5"] },
      { name: "F♯", notes: ["F#5", "A#5", "C#6"] },
      { name: "G♯m", notes: ["G#5", "B5", "D#6"] },
    ],
  },
};

/* =========================================================
   BIG CONTINUOUS WHEEL
   ========================================================= */

const WHEEL_POSITIONS = [
  { dx: 0, dy: -1 },
  { dx: 0.866, dy: -0.5 },
  { dx: 0.866, dy: 0.5 },
  { dx: 0, dy: 1 },
  { dx: -0.866, dy: 0.5 },
  { dx: -0.866, dy: -0.5 },
];

const WHEEL_DEGREES = [0, 4, 5, 3, 1, 2];

/*
   OLD:
   radiusX 0.095
   radiusY 0.175

   NEW:
   substantially bigger.
*/

const WHEEL_RADIUS_X = 0.135;
const WHEEL_RADIUS_Y = 0.235;

/*
   Inner section is neutral.

   Everything from INNER → OUTER
   belongs to one of the six chords.

   No dead zones between chord sectors.
*/

const WHEEL_INNER_RADIUS = 0.28;
const WHEEL_OUTER_RADIUS = 1.18;

/*
   Labels sit inside each sector.
*/

const WHEEL_LABEL_RADIUS = 0.72;

function getWheelCenter(hand: PlayingHand) {
  return {
    x: hand === "right" ? 0.7 : 0.3,
    y: 0.5,
  };
}

function getChordLayout(
  hand: PlayingHand,
  selectedKey: string
): PositionedChord[] {
  const center = getWheelCenter(hand);

  return WHEEL_DEGREES.map((degree, index) => {
    const chord = KEY_DATA[selectedKey].chords[degree];
    const position = WHEEL_POSITIONS[index];

    return {
      ...chord,
      dx: position.dx,
      dy: position.dy,

      x:
        center.x +
        position.dx *
          WHEEL_RADIUS_X *
          WHEEL_LABEL_RADIUS,

      y:
        center.y +
        position.dy *
          WHEEL_RADIUS_Y *
          WHEEL_LABEL_RADIUS,
    };
  });
}

/* =========================================================
   SVG WEDGE
   ========================================================= */

function ellipsePoint(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angleDegreesValue: number
) {
  const angle =
    (angleDegreesValue * Math.PI) / 180;

  return {
    x: cx + Math.cos(angle) * rx,
    y: cy + Math.sin(angle) * ry,
  };
}

function getWheelSectorPath(
  hand: PlayingHand,
  sectorIndex: number
) {
  const centre = getWheelCenter(hand);

  const cx = centre.x * 100;
  const cy = centre.y * 100;

  const outerRX =
    WHEEL_RADIUS_X *
    WHEEL_OUTER_RADIUS *
    100;

  const outerRY =
    WHEEL_RADIUS_Y *
    WHEEL_OUTER_RADIUS *
    100;

  const innerRX =
    WHEEL_RADIUS_X *
    WHEEL_INNER_RADIUS *
    100;

  const innerRY =
    WHEEL_RADIUS_Y *
    WHEEL_INNER_RADIUS *
    100;

  /*
     Sector centres:

     top
     upper-right
     lower-right
     bottom
     lower-left
     upper-left
  */

  const centreAngle =
    -90 + sectorIndex * 60;

  const startAngle =
    centreAngle - 30;

  const endAngle =
    centreAngle + 30;

  const outerStart =
    ellipsePoint(
      cx,
      cy,
      outerRX,
      outerRY,
      startAngle
    );

  const outerEnd =
    ellipsePoint(
      cx,
      cy,
      outerRX,
      outerRY,
      endAngle
    );

  const innerEnd =
    ellipsePoint(
      cx,
      cy,
      innerRX,
      innerRY,
      endAngle
    );

  const innerStart =
    ellipsePoint(
      cx,
      cy,
      innerRX,
      innerRY,
      startAngle
    );

  return [
    `M ${outerStart.x} ${outerStart.y}`,

    `A ${outerRX} ${outerRY} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,

    `L ${innerEnd.x} ${innerEnd.y}`,

    `A ${innerRX} ${innerRY} 0 0 0 ${innerStart.x} ${innerStart.y}`,

    "Z",
  ].join(" ");
}

/* =========================================================
   NOTE HELPERS
   ========================================================= */

const NOTE_VALUES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const SHARP_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function noteToMidi(note: string) {
  const match =
    note.match(/^([A-G](?:#|b)?)(-?\d+)$/);

  if (!match) return 60;

  return (
    (Number(match[2]) + 1) * 12 +
    NOTE_VALUES[match[1]]
  );
}

function midiToNote(midi: number) {
  const pitch =
    ((midi % 12) + 12) % 12;

  const octave =
    Math.floor(midi / 12) - 1;

  return `${SHARP_NAMES[pitch]}${octave}`;
}

function transpose(
  note: string,
  semitones: number
) {
  return midiToNote(
    noteToMidi(note) + semitones
  );
}

/* =========================================================
   GEOMETRY
   ========================================================= */

function distance(
  a: Point,
  b: Point
) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(
    dx * dx + dy * dy
  );
}

function averagePoint(
  points: Point[]
): Point {
  const total =
    points.reduce(
      (sum, point) => ({
        x: sum.x + point.x,
        y: sum.y + point.y,
      }),
      {
        x: 0,
        y: 0,
      }
    );

  return {
    x:
      total.x /
      points.length,

    y:
      total.y /
      points.length,
  };
}

function smoothPoint(
  previous: Point | null,
  current: Point,
  amount = 0.29
): Point {
  if (!previous) {
    return {
      ...current,
    };
  }

  return {
    x:
      previous.x +
      (
        current.x -
        previous.x
      ) *
        amount,

    y:
      previous.y +
      (
        current.y -
        previous.y
      ) *
        amount,

    z:
      previous.z !== undefined &&
      current.z !== undefined
        ? previous.z +
          (
            current.z -
            previous.z
          ) *
            amount
        : current.z,
  };
}

function angleDegrees(
  a: Point,
  b: Point,
  c: Point
) {
  const abX =
    a.x - b.x;

  const abY =
    a.y - b.y;

  const cbX =
    c.x - b.x;

  const cbY =
    c.y - b.y;

  const dot =
    abX * cbX +
    abY * cbY;

  const magAB =
    Math.sqrt(
      abX * abX +
        abY * abY
    );

  const magCB =
    Math.sqrt(
      cbX * cbX +
        cbY * cbY
    );

  if (
    magAB === 0 ||
    magCB === 0
  ) {
    return 0;
  }

  const cosine =
    Math.max(
      -1,
      Math.min(
        1,
        dot /
          (
            magAB *
            magCB
          )
      )
    );

  return (
    Math.acos(cosine) *
    180 /
    Math.PI
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}

/* =========================================================
   FINGER COUNT
   ========================================================= */

function countExtendedFingers(
  landmarks: Point[]
) {
  if (
    landmarks.length < 21
  ) {
    return 0;
  }

  let count = 0;

  const wrist =
    landmarks[0];

  const palmCentre =
    averagePoint([
      landmarks[0],
      landmarks[5],
      landmarks[9],
      landmarks[13],
      landmarks[17],
    ]);

  const palmWidth =
    distance(
      landmarks[5],
      landmarks[17]
    );

  const fingerData = [
    [5, 6, 7, 8, 150, 1.08],
    [9, 10, 11, 12, 150, 1.08],
    [13, 14, 15, 16, 150, 1.07],
    [17, 18, 19, 20, 145, 1.06],
  ];

  for (
    const data of
    fingerData
  ) {
    const [
      mcp,
      pip,
      dip,
      tip,
      requiredAngle,
      ratio,
    ] = data;

    const angle =
      angleDegrees(
        landmarks[mcp],
        landmarks[pip],
        landmarks[dip]
      );

    const extended =
      angle >
        requiredAngle &&
      distance(
        wrist,
        landmarks[tip]
      ) >
        distance(
          wrist,
          landmarks[pip]
        ) *
          ratio;

    if (
      extended
    ) {
      count++;
    }
  }

  const thumbAngle =
    angleDegrees(
      landmarks[2],
      landmarks[3],
      landmarks[4]
    );

  const thumbAway =
    distance(
      palmCentre,
      landmarks[4]
    );

  if (
    thumbAngle > 155 &&
    thumbAway >
      palmWidth *
        1.15
  ) {
    count++;
  }

  return Math.min(
    5,
    Math.max(
      0,
      count
    )
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const handLandmarkerRef =
    useRef<HandLandmarker | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const animationFrameRef =
    useRef<number | null>(
      null
    );

  /* AUDIO */

  const masterGainRef =
    useRef<Tone.Gain | null>(
      null
    );

  const limiterRef =
    useRef<Tone.Limiter | null>(
      null
    );

  const pianoRef =
    useRef<Tone.Sampler | null>(
      null
    );

  const violinSustainRef =
    useRef<Tone.Sampler | null>(
      null
    );

  const violaSustainRef =
    useRef<Tone.Sampler | null>(
      null
    );

  const celloPizzRR1Ref =
    useRef<Tone.Sampler | null>(
      null
    );

  const celloPizzRR2Ref =
    useRef<Tone.Sampler | null>(
      null
    );

  const violinSpicRR1Ref =
    useRef<Tone.Sampler | null>(
      null
    );

  const violinSpicRR2Ref =
    useRef<Tone.Sampler | null>(
      null
    );

  const violinTremRef =
    useRef<Tone.Sampler | null>(
      null
    );

  const hornRef =
    useRef<Tone.Sampler | null>(
      null
    );

  const audioReadyRef =
    useRef(false);

  /* PATTERNS */

  const pizzTimerRef =
    useRef<number | null>(
      null
    );

  const pizzStepRef =
    useRef(0);

  const pizzRoundRobinRef =
    useRef(0);

  const spicTimerRef =
    useRef<number | null>(
      null
    );

  const spicStepRef =
    useRef(0);

  const spicRoundRobinRef =
    useRef(0);

  /* TWO HANDS */

  const twoHandsSinceRef =
    useRef(0);

  const twoHandsStableRef =
    useRef(false);

  const conductorDetectedRef =
    useRef(false);

  /* TRACKING */

  const playingPalmRef =
    useRef<Point | null>(
      null
    );

  const conductorPalmRef =
    useRef<Point | null>(
      null
    );

  const smoothedIndexTipRef =
    useRef<Point | null>(
      null
    );

  /* DYNAMICS */

  const smoothedConductorYRef =
    useRef<number | null>(
      null
    );

  const conductorIntensityRef =
    useRef(0.65);

  const conductorIntensityPercentRef =
    useRef(65);

  /* CHORD */

  const currentChordRef =
    useRef<PositionedChord | null>(
      null
    );

  const hoveredChordRef =
    useRef<string | null>(
      null
    );

  const neutralRef =
    useRef(false);

  const candidateChordRef =
    useRef<string | null>(
      null
    );

  const candidateChordSinceRef =
    useRef(0);

  /* CONDUCTOR COUNT */

  const observedFingerCountRef =
    useRef<number | null>(
      null
    );

  const candidateFingerCountRef =
    useRef<number | null>(
      null
    );

  const candidateSinceRef =
    useRef(0);

  const stableFingerCountRef =
    useRef(-1);

  const activeLayerCountRef =
    useRef(0);

  /* STATE */

  const [
    status,
    setStatus,
  ] =
    useState(
      "Ready"
    );

  const [
    cameraStarted,
    setCameraStarted,
  ] =
    useState(false);

  const [
    hoveredChord,
    setHoveredChord,
  ] =
    useState<string | null>(
      null
    );

  const [
    isNeutral,
    setIsNeutral,
  ] =
    useState(false);

  const [
    activeLayerCount,
    setActiveLayerCount,
  ] =
    useState(0);

  const [
    conductorDetected,
    setConductorDetected,
  ] =
    useState(false);

  const [
    observedFingerCount,
    setObservedFingerCount,
  ] =
    useState<number | null>(
      null
    );

  const [
    conductorIntensityPercent,
    setConductorIntensityPercent,
  ] =
    useState(65);

  const [
    selectedKey,
    setSelectedKey,
  ] =
    useState(() => {
      const saved =
        localStorage.getItem(
          "chordspace-key"
        );

      return (
        saved &&
        KEY_DATA[saved]
          ? saved
          : "C"
      );
    });

  const [
    playingHand,
    setPlayingHand,
  ] =
    useState<PlayingHand>(
      () =>
        localStorage.getItem(
          "chordspace-playing-hand"
        ) ===
        "left"
          ? "left"
          : "right"
    );

  const playingHandRef =
    useRef<PlayingHand>(
      playingHand
    );

  const selectedKeyRef =
    useRef(
      selectedKey
    );

  const chordLayout =
    getChordLayout(
      playingHand,
      selectedKey
    );

  const wheelCenter =
    getWheelCenter(
      playingHand
    );

  /* =========================================================
     OUTPUT
     ========================================================= */

  function getLevelGain(
    level: number
  ) {
    switch (
      level
    ) {
      case 1:
        return 0.95;

      case 2:
        return 0.96;

      case 3:
        return 0.98;

      case 4:
        return 1;

      case 5:
        return 1.02;

      default:
        return 0;
    }
  }

  function getDynamicsMultiplier(
    intensity =
      conductorIntensityRef.current
  ) {
    return (
      0.55 +
      intensity *
        0.75
    );
  }

  function getCurrentOutputGain() {
    const level =
      activeLayerCountRef.current;

    if (
      level <= 0
    ) {
      return 0;
    }

    return (
      getLevelGain(
        level
      ) *
      getDynamicsMultiplier()
    );
  }

  function setMasterGate(
    open: boolean
  ) {
    const master =
      masterGainRef.current;

    if (
      !master
    ) {
      return;
    }

    const target =
      open
        ? getCurrentOutputGain()
        : 0;

    master.gain.rampTo(
      target,
      open
        ? 0.055
        : 0.012
    );
  }

  /* =========================================================
     CONDUCTOR DYNAMICS
     ========================================================= */

  function processConductorDynamics(
    landmarks: Point[]
  ) {
    const palm =
      getPalm(
        landmarks
      );

    if (
      smoothedConductorYRef.current ===
      null
    ) {
      smoothedConductorYRef.current =
        palm.y;
    } else {
      smoothedConductorYRef.current +=
        (
          palm.y -
          smoothedConductorYRef.current
        ) *
        0.1;
    }

    const y =
      smoothedConductorYRef.current;

    const HIGH_POINT =
      0.22;

    const LOW_POINT =
      0.78;

    const intensity =
      clamp(
        (
          LOW_POINT -
          y
        ) /
          (
            LOW_POINT -
            HIGH_POINT
          ),
        0,
        1
      );

    conductorIntensityRef.current =
      intensity;

    const percentage =
      Math.round(
        intensity *
          100
      );

    if (
      Math.abs(
        percentage -
          conductorIntensityPercentRef.current
      ) >=
      1
    ) {
      conductorIntensityPercentRef.current =
        percentage;

      setConductorIntensityPercent(
        percentage
      );
    }

    if (
      twoHandsStableRef.current &&
      conductorDetectedRef.current &&
      activeLayerCountRef.current >
        0
    ) {
      masterGainRef.current
        ?.gain.rampTo(
          getCurrentOutputGain(),
          0.09
        );
    }
  }

  function getDynamicsLabel(
    value: number
  ) {
    if (
      value <
      30
    ) {
      return "SOFT";
    }

    if (
      value <
      70
    ) {
      return "MEDIUM";
    }

    return "STRONG";
  }

  /* =========================================================
     AUDIO SETUP
     ========================================================= */

  async function setupAudio() {
    if (
      audioReadyRef.current
    ) {
      await Tone.start();
      return;
    }

    setStatus(
      "Loading orchestra..."
    );

    await Tone.start();

    const limiter =
      new Tone.Limiter(
        -1
      ).toDestination();

    limiterRef.current =
      limiter;

    const masterGain =
      new Tone.Gain(
        0
      );

    masterGain.connect(
      limiter
    );

    masterGainRef.current =
      masterGain;

    const piano =
      new Tone.Sampler({
        urls: {
          F2: "F2.wav",
          A2: "A2.wav",
          "C#3": "Cs3.wav",
          F3: "F3.wav",
          A3: "A3.wav",
          "C#4": "Cs4.wav",
          F4: "F4.wav",
          A4: "A4.wav",
          "C#5": "Cs5.wav",
        },

        baseUrl:
          "/samples/piano/",

        attack:
          0.005,

        release:
          0.95,
      });

    piano.volume.value =
      -3;

    piano.connect(
      masterGain
    );

    const violinSustain =
      new Tone.Sampler({
        urls: {
          G2: "G2.wav",
          D3: "D3.wav",
          "F#3": "Fs3.wav",
          A3: "A3.wav",
          C4: "C4.wav",
          E4: "E4.wav",
          G4: "G4.wav",
          B4: "B4.wav",
          D5: "D5.wav",
        },

        baseUrl:
          "/samples/violin/",

        attack:
          0.09,

        release:
          1.45,
      });

    violinSustain.volume.value =
      -7;

    violinSustain.connect(
      masterGain
    );

    const violaSustain =
      new Tone.Sampler({
        urls: {
          C2: "C2.wav",
          G2: "G2.wav",
          D3: "D3.wav",
          F3: "F3.wav",
          A3: "A3.wav",
          C4: "C4.wav",
          E4: "E4.wav",
          G4: "G4.wav",
          B4: "B4.wav",
          D5: "D5.wav",
        },

        baseUrl:
          "/samples/viola/",

        attack:
          0.11,

        release:
          1.55,
      });

    violaSustain.volume.value =
      -9;

    violaSustain.connect(
      masterGain
    );

    const celloPizzRR1 =
      new Tone.Sampler({
        urls: {
          C1: "C1.wav",
          E1: "E1.wav",
          G1: "G1.wav",
          B1: "B1.wav",
          D2: "D2.wav",
          F2: "F2.wav",
          A2: "A2.wav",
          C3: "C3.wav",
          E3: "E3.wav",
          G3: "G3.wav",
        },

        baseUrl:
          "/samples/cello-pizz/rr1/",

        attack:
          0,

        release:
          0.28,
      });

    celloPizzRR1.volume.value =
      -6;

    celloPizzRR1.connect(
      masterGain
    );

    const celloPizzRR2 =
      new Tone.Sampler({
        urls: {
          C1: "C1.wav",
          E1: "E1.wav",
          G1: "G1.wav",
          B1: "B1.wav",
          D2: "D2.wav",
          F2: "F2.wav",
          A2: "A2.wav",
          C3: "C3.wav",
          E3: "E3.wav",
          G3: "G3.wav",
        },

        baseUrl:
          "/samples/cello-pizz/rr2/",

        attack:
          0,

        release:
          0.28,
      });

    celloPizzRR2.volume.value =
      -6;

    celloPizzRR2.connect(
      masterGain
    );

    const violinSpicRR1 =
      new Tone.Sampler({
        urls: {
          G2: "G2.wav",
          A2: "A2.wav",
          B2: "B2.wav",
          D3: "D3.wav",
          "F#3": "Fs3.wav",
          A3: "A3.wav",
          C4: "C4.wav",
          E4: "E4.wav",
          G4: "G4.wav",
          B4: "B4.wav",
          D5: "D5.wav",
        },

        baseUrl:
          "/samples/violin-spic/rr1/",

        attack:
          0,

        release:
          0.2,
      });

    violinSpicRR1.volume.value =
      -8;

    violinSpicRR1.connect(
      masterGain
    );

    const violinSpicRR2 =
      new Tone.Sampler({
        urls: {
          G2: "G2.wav",
          A2: "A2.wav",
          B2: "B2.wav",
          D3: "D3.wav",
          "F#3": "Fs3.wav",
          A3: "A3.wav",
          C4: "C4.wav",
          E4: "E4.wav",
          G4: "G4.wav",
          B4: "B4.wav",
          D5: "D5.wav",
        },

        baseUrl:
          "/samples/violin-spic/rr2/",

        attack:
          0,

        release:
          0.2,
      });

    violinSpicRR2.volume.value =
      -8;

    violinSpicRR2.connect(
      masterGain
    );

    const violinTrem =
      new Tone.Sampler({
        urls: {
          G2: "G2.wav",
          A2: "A2.wav",
          B2: "B2.wav",
          D3: "D3.wav",
          "F#3": "Fs3.wav",
          A3: "A3.wav",
          C4: "C4.wav",
          E4: "E4.wav",
          G4: "G4.wav",
          B4: "B4.wav",
          D5: "D5.wav",
        },

        baseUrl:
          "/samples/violin-trem/",

        attack:
          0.045,

        release:
          1.05,
      });

    violinTrem.volume.value =
      -8;

    violinTrem.connect(
      masterGain
    );

    const horn =
      new Tone.Sampler({
        urls: {
          C1: "C1.wav",
          G1: "G1.wav",
          D2: "D2.wav",
          F2: "F2.wav",
          A2: "A2.wav",
          C3: "C3.wav",
          D4: "D4.wav",
          F4: "F4.wav",
        },

        baseUrl:
          "/samples/horn/",

        attack:
          0.09,

        release:
          1.75,
      });

    horn.volume.value =
      -9;

    horn.connect(
      masterGain
    );

    pianoRef.current =
      piano;

    violinSustainRef.current =
      violinSustain;

    violaSustainRef.current =
      violaSustain;

    celloPizzRR1Ref.current =
      celloPizzRR1;

    celloPizzRR2Ref.current =
      celloPizzRR2;

    violinSpicRR1Ref.current =
      violinSpicRR1;

    violinSpicRR2Ref.current =
      violinSpicRR2;

    violinTremRef.current =
      violinTrem;

    hornRef.current =
      horn;

    await Tone.loaded();

    audioReadyRef.current =
      true;

    setStatus(
      "Ready • show both hands"
    );
  }

  /* =========================================================
     AUDIO PLAYBACK
     ========================================================= */

  function randomVelocity(
    minimum: number,
    maximum: number
  ) {
    return (
      minimum +
      Math.random() *
        (
          maximum -
          minimum
        )
    );
  }

  function startPiano(
    chord: PositionedChord
  ) {
    const piano =
      pianoRef.current;

    if (
      !piano
    ) {
      return;
    }

    const now =
      Tone.now();

    chord.notes.forEach(
      (
        note,
        index
      ) => {
        piano.triggerAttack(
          note,

          now +
            index *
              0.012,

          randomVelocity(
            0.82,
            0.95
          )
        );
      }
    );
  }

  function startSustainStrings(
    chord: PositionedChord
  ) {
    const [
      root,
      third,
      fifth,
    ] =
      chord.notes;

    const now =
      Tone.now();

    violinSustainRef.current
      ?.triggerAttack(
        third,
        now + 0.015,
        randomVelocity(
          0.64,
          0.79
        )
      );

    violinSustainRef.current
      ?.triggerAttack(
        fifth,
        now + 0.034,
        randomVelocity(
          0.64,
          0.79
        )
      );

    violinSustainRef.current
      ?.triggerAttack(
        transpose(
          root,
          12
        ),
        now + 0.052,
        randomVelocity(
          0.6,
          0.75
        )
      );

    violaSustainRef.current
      ?.triggerAttack(
        transpose(
          root,
          -12
        ),
        now + 0.01,
        randomVelocity(
          0.6,
          0.76
        )
      );

    violaSustainRef.current
      ?.triggerAttack(
        transpose(
          fifth,
          -12
        ),
        now + 0.029,
        randomVelocity(
          0.58,
          0.73
        )
      );

    violaSustainRef.current
      ?.triggerAttack(
        third,
        now + 0.047,
        randomVelocity(
          0.58,
          0.73
        )
      );
  }

  function startHorn(
    chord: PositionedChord
  ) {
    const [
      root,
      ,
      fifth,
    ] =
      chord.notes;

    const now =
      Tone.now();

    hornRef.current
      ?.triggerAttack(
        transpose(
          root,
          -12
        ),
        now + 0.018,
        randomVelocity(
          0.6,
          0.75
        )
      );

    hornRef.current
      ?.triggerAttack(
        transpose(
          fifth,
          -12
        ),
        now + 0.05,
        randomVelocity(
          0.56,
          0.71
        )
      );
  }

  function startTremolo(
    chord: PositionedChord
  ) {
    const [
      root,
      third,
      fifth,
    ] =
      chord.notes;

    const now =
      Tone.now();

    violinTremRef.current
      ?.triggerAttack(
        root,
        now + 0.01,
        randomVelocity(
          0.58,
          0.73
        )
      );

    violinTremRef.current
      ?.triggerAttack(
        third,
        now + 0.03,
        randomVelocity(
          0.56,
          0.71
        )
      );

    violinTremRef.current
      ?.triggerAttack(
        fifth,
        now + 0.05,
        randomVelocity(
          0.56,
          0.71
        )
      );
  }

  /* =========================================================
     PIZZ
     ========================================================= */

  function stopPizzPattern() {
    if (
      pizzTimerRef.current !==
      null
    ) {
      window.clearInterval(
        pizzTimerRef.current
      );

      pizzTimerRef.current =
        null;
    }

    pizzStepRef.current =
      0;

    celloPizzRR1Ref.current
      ?.releaseAll();

    celloPizzRR2Ref.current
      ?.releaseAll();
  }

  function startPizzPattern(
    chord: PositionedChord
  ) {
    stopPizzPattern();

    const [
      root,
      ,
      fifth,
    ] =
      chord.notes;

    const pattern = [
      transpose(
        root,
        -24
      ),

      transpose(
        fifth,
        -24
      ),

      transpose(
        root,
        -12
      ),

      transpose(
        fifth,
        -24
      ),
    ];

    const playStep =
      () => {
        if (
          !twoHandsStableRef.current ||
          !conductorDetectedRef.current ||
          activeLayerCountRef.current <
            3
        ) {
          return;
        }

        const note =
          pattern[
            pizzStepRef.current %
              pattern.length
          ];

        const useRR1 =
          pizzRoundRobinRef.current %
            2 ===
          0;

        const sampler =
          useRR1
            ? celloPizzRR1Ref.current
            : celloPizzRR2Ref.current;

        sampler
          ?.triggerAttackRelease(
            note,
            0.25,
            undefined,
            randomVelocity(
              0.68,
              0.82
            )
          );

        pizzRoundRobinRef.current++;

        pizzStepRef.current =
          (
            pizzStepRef.current +
            1
          ) %
          pattern.length;
      };

    playStep();

    pizzTimerRef.current =
      window.setInterval(
        playStep,
        520
      );
  }

  /* =========================================================
     SPICCATO
     ========================================================= */

  function stopSpicPattern() {
    if (
      spicTimerRef.current !==
      null
    ) {
      window.clearInterval(
        spicTimerRef.current
      );

      spicTimerRef.current =
        null;
    }

    spicStepRef.current =
      0;

    violinSpicRR1Ref.current
      ?.releaseAll();

    violinSpicRR2Ref.current
      ?.releaseAll();
  }

  function startSpicPattern(
    chord: PositionedChord
  ) {
    stopSpicPattern();

    const [
      root,
      third,
      fifth,
    ] =
      chord.notes;

    const pattern = [
      root,
      third,
      fifth,

      transpose(
        root,
        12
      ),

      fifth,
      third,
    ];

    const playStep =
      () => {
        if (
          !twoHandsStableRef.current ||
          !conductorDetectedRef.current ||
          activeLayerCountRef.current <
            4
        ) {
          return;
        }

        const note =
          pattern[
            spicStepRef.current %
              pattern.length
          ];

        const useRR1 =
          spicRoundRobinRef.current %
            2 ===
          0;

        const sampler =
          useRR1
            ? violinSpicRR1Ref.current
            : violinSpicRR2Ref.current;

        sampler
          ?.triggerAttackRelease(
            note,
            0.17,
            undefined,
            randomVelocity(
              0.58,
              0.72
            )
          );

        spicRoundRobinRef.current++;

        spicStepRef.current =
          (
            spicStepRef.current +
            1
          ) %
          pattern.length;
      };

    playStep();

    spicTimerRef.current =
      window.setInterval(
        playStep,
        280
      );
  }

  /* =========================================================
     STOP
     ========================================================= */

  function stopAllLayers() {
    pianoRef.current
      ?.releaseAll();

    violinSustainRef.current
      ?.releaseAll();

    violaSustainRef.current
      ?.releaseAll();

    hornRef.current
      ?.releaseAll();

    violinTremRef.current
      ?.releaseAll();

    stopPizzPattern();

    stopSpicPattern();
  }

  /* =========================================================
     ORCHESTRA
     ========================================================= */

  function startOrchestra(
    chord: PositionedChord
  ) {
    if (
      !audioReadyRef.current ||
      !twoHandsStableRef.current ||
      !conductorDetectedRef.current
    ) {
      return;
    }

    const level =
      activeLayerCountRef.current;

    if (
      level <= 0
    ) {
      stopAllLayers();

      return;
    }

    startPiano(
      chord
    );

    if (
      level >= 2
    ) {
      startSustainStrings(
        chord
      );
    }

    if (
      level >= 3
    ) {
      startPizzPattern(
        chord
      );
    }

    if (
      level >= 4
    ) {
      startSpicPattern(
        chord
      );

      startHorn(
        chord
      );
    }

    if (
      level >= 5
    ) {
      startTremolo(
        chord
      );
    }
  }

  function startChord(
    chord: PositionedChord
  ) {
    if (
      !twoHandsStableRef.current ||
      !conductorDetectedRef.current
    ) {
      setMasterGate(
        false
      );

      stopAllLayers();

      return;
    }

    if (
      activeLayerCountRef.current <=
      0
    ) {
      stopAllLayers();

      return;
    }

    stopAllLayers();

    currentChordRef.current =
      chord;

    startOrchestra(
      chord
    );

    setStatus(
      `♪ ${chord.name} • level ${activeLayerCountRef.current}`
    );
  }

  /* =========================================================
     ORCHESTRA LEVEL
     ========================================================= */

  function changeLayerCount(
    newCount: number
  ) {
    const safeCount =
      Math.min(
        5,
        Math.max(
          0,
          newCount
        )
      );

    activeLayerCountRef.current =
      safeCount;

    stableFingerCountRef.current =
      safeCount;

    setActiveLayerCount(
      safeCount
    );

    if (
      !twoHandsStableRef.current ||
      !conductorDetectedRef.current
    ) {
      setMasterGate(
        false
      );

      stopAllLayers();

      return;
    }

    setMasterGate(
      true
    );

    if (
      safeCount ===
      0
    ) {
      stopAllLayers();

      setStatus(
        "Conductor • silence"
      );

      return;
    }

    const chord =
      currentChordRef.current;

    if (
      !chord
    ) {
      setStatus(
        `Orchestra level ${safeCount}`
      );

      return;
    }

    stopAllLayers();

    startOrchestra(
      chord
    );

    setStatus(
      `♪ ${chord.name} • level ${safeCount}`
    );
  }

  function processConductorCount(
    count: number,
    now: number
  ) {
    if (
      observedFingerCountRef.current !==
      count
    ) {
      observedFingerCountRef.current =
        count;

      setObservedFingerCount(
        count
      );
    }

    if (
      candidateFingerCountRef.current !==
      count
    ) {
      candidateFingerCountRef.current =
        count;

      candidateSinceRef.current =
        now;

      return;
    }

    if (
      now -
        candidateSinceRef.current >=
        220 &&
      stableFingerCountRef.current !==
        count
    ) {
      changeLayerCount(
        count
      );
    }
  }

  /* =========================================================
     CONDUCTOR PRESENCE
     ========================================================= */

  function updateConductorPresence(
    present: boolean
  ) {
    if (
      conductorDetectedRef.current ===
      present
    ) {
      return;
    }

    conductorDetectedRef.current =
      present;

    setConductorDetected(
      present
    );

    if (
      !present
    ) {
      setMasterGate(
        false
      );

      stopAllLayers();

      activeLayerCountRef.current =
        0;

      setActiveLayerCount(
        0
      );

      stableFingerCountRef.current =
        -1;

      observedFingerCountRef.current =
        null;

      candidateFingerCountRef.current =
        null;

      candidateSinceRef.current =
        0;

      setObservedFingerCount(
        null
      );

      smoothedConductorYRef.current =
        null;

      conductorIntensityRef.current =
        0.65;

      conductorIntensityPercentRef.current =
        65;

      setConductorIntensityPercent(
        65
      );

      setStatus(
        "Two hands required • silence"
      );

      return;
    }

    activeLayerCountRef.current =
      0;

    setActiveLayerCount(
      0
    );

    stableFingerCountRef.current =
      -1;

    observedFingerCountRef.current =
      null;

    candidateFingerCountRef.current =
      null;

    candidateSinceRef.current =
      0;

    setObservedFingerCount(
      null
    );

    setStatus(
      "Both hands detected • show 0–5 fingers"
    );
  }

  /* =========================================================
     TRACKER
     ========================================================= */

  async function loadHandTracker() {
    setStatus(
      "Loading hand tracker..."
    );

    const vision =
      await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

    handLandmarkerRef.current =
      await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",

            delegate:
              "GPU",
          },

          runningMode:
            "VIDEO",

          numHands:
            2,

          minHandDetectionConfidence:
            0.5,

          minHandPresenceConfidence:
            0.5,

          minTrackingConfidence:
            0.55,
        }
      );
  }

  async function startCamera() {
    try {
      await setupAudio();

      await loadHandTracker();

      setStatus(
        "Requesting camera..."
      );

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              width: {
                ideal:
                  1280,
              },

              height: {
                ideal:
                  720,
              },

              facingMode:
                "user",
            },

            audio:
              false,
          }
        );

      streamRef.current =
        stream;

      const video =
        videoRef.current;

      if (
        !video
      ) {
        return;
      }

      video.srcObject =
        stream;

      await video.play();

      setCameraStarted(
        true
      );

      setMasterGate(
        false
      );

      setStatus(
        "Show both hands to play"
      );

      detectHands();
    } catch (
      error
    ) {
      console.error(
        error
      );

      setStatus(
        "Camera or orchestra failed"
      );
    }
  }

  /* =========================================================
     HAND ASSIGNMENT
     ========================================================= */

  function getPalm(
    landmarks: Point[]
  ) {
    return averagePoint([
      landmarks[0],
      landmarks[5],
      landmarks[9],
      landmarks[13],
      landmarks[17],
    ]);
  }

  function assignHands(
    results: HandResults
  ) {
    const hands:
      DetectedHand[] =
      results.landmarks.map(
        (
          landmarks,
          index
        ) => ({
          index,

          landmarks,

          palm:
            getPalm(
              landmarks
            ),
        })
      );

    if (
      hands.length <
      2
    ) {
      return {
        playing:
          undefined,

        conductor:
          undefined,
      };
    }

    let playing:
      DetectedHand;

    if (
      playingPalmRef.current
    ) {
      playing =
        hands.reduce(
          (
            best,
            hand
          ) => {
            const d =
              distance(
                hand.palm,
                playingPalmRef.current!
              );

            const bestD =
              distance(
                best.palm,
                playingPalmRef.current!
              );

            return d <
              bestD
              ? hand
              : best;
          }
        );
    } else {
      const wheel =
        getWheelCenter(
          playingHandRef.current
        );

      playing =
        hands.reduce(
          (
            best,
            hand
          ) => {
            const point =
              hand.landmarks[8];

            const bestPoint =
              best.landmarks[8];

            const x =
              1 -
              point.x;

            const y =
              point.y;

            const bx =
              1 -
              bestPoint.x;

            const by =
              bestPoint.y;

            const d =
              (
                x -
                wheel.x
              ) **
                2 *
                1.5 +
              (
                y -
                wheel.y
              ) **
                2;

            const bd =
              (
                bx -
                wheel.x
              ) **
                2 *
                1.5 +
              (
                by -
                wheel.y
              ) **
                2;

            return d <
              bd
              ? hand
              : best;
          }
        );
    }

    const conductor =
      hands.find(
        (
          hand
        ) =>
          hand.index !==
          playing.index
      );

    playingPalmRef.current =
      smoothPoint(
        playingPalmRef.current,
        playing.palm,
        0.42
      );

    if (
      conductor
    ) {
      conductorPalmRef.current =
        smoothPoint(
          conductorPalmRef.current,
          conductor.palm,
          0.42
        );
    }

    return {
      playing,
      conductor,
    };
  }

  function resetHandLock() {
    playingPalmRef.current =
      null;

    conductorPalmRef.current =
      null;

    smoothedIndexTipRef.current =
      null;

    candidateChordRef.current =
      null;

    candidateChordSinceRef.current =
      0;

    smoothedConductorYRef.current =
      null;
  }

  function changePlayingHand(
    hand: PlayingHand
  ) {
    stopAllLayers();

    currentChordRef.current =
      null;

    playingHandRef.current =
      hand;

    setPlayingHand(
      hand
    );

    localStorage.setItem(
      "chordspace-playing-hand",
      hand
    );

    hoveredChordRef.current =
      null;

    neutralRef.current =
      false;

    setHoveredChord(
      null
    );

    setIsNeutral(
      false
    );

    resetHandLock();

    setStatus(
      `${
        hand ===
        "right"
          ? "Right"
          : "Left"
      } chord hand selected`
    );
  }

  function changeKey(
    key: string
  ) {
    stopAllLayers();

    currentChordRef.current =
      null;

    selectedKeyRef.current =
      key;

    setSelectedKey(
      key
    );

    localStorage.setItem(
      "chordspace-key",
      key
    );

    hoveredChordRef.current =
      null;

    candidateChordRef.current =
      null;

    setHoveredChord(
      null
    );

    setStatus(
      `Key: ${KEY_DATA[key].label}`
    );
  }

  /* =========================================================
     LARGE CONTINUOUS HIT AREA
     ========================================================= */

  function getNormalisedWheelDistance(
    fingerX: number,
    fingerY: number
  ) {
    const centre =
      getWheelCenter(
        playingHandRef.current
      );

    const x =
      (
        fingerX -
        centre.x
      ) /
      WHEEL_RADIUS_X;

    const y =
      (
        fingerY -
        centre.y
      ) /
      WHEEL_RADIUS_Y;

    return Math.sqrt(
      x * x +
        y * y
    );
  }

  function fingerIsNeutral(
    fingerX: number,
    fingerY: number
  ) {
    return (
      getNormalisedWheelDistance(
        fingerX,
        fingerY
      ) <
      WHEEL_INNER_RADIUS
    );
  }

  function findHoveredChord(
    fingerX: number,
    fingerY: number
  ): PositionedChord | null {
    const centre =
      getWheelCenter(
        playingHandRef.current
      );

    const relativeX =
      (
        fingerX -
        centre.x
      ) /
      WHEEL_RADIUS_X;

    const relativeY =
      (
        fingerY -
        centre.y
      ) /
      WHEEL_RADIUS_Y;

    const radius =
      Math.sqrt(
        relativeX *
          relativeX +
        relativeY *
          relativeY
      );

    /*
       Only centre and outside edge are inactive.

       There are ZERO angular gaps.
    */

    if (
      radius <
        WHEEL_INNER_RADIUS ||
      radius >
        WHEEL_OUTER_RADIUS
    ) {
      return null;
    }

    const layout =
      getChordLayout(
        playingHandRef.current,
        selectedKeyRef.current
      );

    let closest:
      PositionedChord | null =
      null;

    let closestDistance =
      Infinity;

    for (
      const chord of
      layout
    ) {
      const chordX =
        (
          chord.x -
          centre.x
        ) /
        WHEEL_RADIUS_X;

      const chordY =
        (
          chord.y -
          centre.y
        ) /
        WHEEL_RADIUS_Y;

      const dx =
        relativeX -
        chordX;

      const dy =
        relativeY -
        chordY;

      const d =
        dx *
          dx +
        dy *
          dy;

      if (
        d <
        closestDistance
      ) {
        closestDistance =
          d;

        closest =
          chord;
      }
    }

    return closest;
  }

  /* =========================================================
     CHORD STABILITY
     ========================================================= */

  function commitChord(
    chord:
      PositionedChord | null
  ) {
    const nextName =
      chord?.name ??
      null;

    if (
      hoveredChordRef.current ===
      nextName
    ) {
      if (
        chord
      ) {
        currentChordRef.current =
          chord;
      }

      return;
    }

    hoveredChordRef.current =
      nextName;

    currentChordRef.current =
      chord;

    setHoveredChord(
      nextName
    );

    if (
      chord
    ) {
      startChord(
        chord
      );
    } else {
      stopAllLayers();
    }
  }

  function processChordCandidate(
    chord:
      PositionedChord | null,

    neutral:
      boolean,

    now:
      number
  ) {
    if (
      neutral
    ) {
      candidateChordRef.current =
        null;

      candidateChordSinceRef.current =
        0;

      if (
        !neutralRef.current
      ) {
        neutralRef.current =
          true;

        setIsNeutral(
          true
        );

        commitChord(
          null
        );

        setStatus(
          "Neutral • silence"
        );
      }

      return;
    }

    if (
      neutralRef.current
    ) {
      neutralRef.current =
        false;

      setIsNeutral(
        false
      );
    }

    if (
      !chord
    ) {
      candidateChordRef.current =
        null;

      candidateChordSinceRef.current =
        0;

      commitChord(
        null
      );

      return;
    }

    if (
      hoveredChordRef.current ===
      chord.name
    ) {
      currentChordRef.current =
        chord;

      return;
    }

    if (
      candidateChordRef.current !==
      chord.name
    ) {
      candidateChordRef.current =
        chord.name;

      candidateChordSinceRef.current =
        now;

      return;
    }

    /*
       Slightly quicker switch now,
       because the sectors are larger.

       Makes sliding around the ring
       feel responsive.
    */

    if (
      now -
        candidateChordSinceRef.current >=
      80
    ) {
      commitChord(
        chord
      );

      candidateChordSinceRef.current =
        now;
    }
  }

  function clearPlayingHand() {
    stopAllLayers();

    currentChordRef.current =
      null;

    hoveredChordRef.current =
      null;

    candidateChordRef.current =
      null;

    candidateChordSinceRef.current =
      0;

    neutralRef.current =
      false;

    setHoveredChord(
      null
    );

    setIsNeutral(
      false
    );
  }

  /* =========================================================
     CURSORS
     ========================================================= */

  function drawPlayingCursor(
    ctx:
      CanvasRenderingContext2D,

    point:
      Point,

    width:
      number,

    height:
      number
  ) {
    const x =
      point.x *
      width;

    const y =
      point.y *
      height;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      13,
      0,
      Math.PI *
        2
    );

    ctx.fillStyle =
      "rgba(255,255,255,0.96)";

    ctx.shadowColor =
      "#c4b5fd";

    ctx.shadowBlur =
      30;

    ctx.fill();

    ctx.shadowBlur =
      0;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      4,
      0,
      Math.PI *
        2
    );

    ctx.fillStyle =
      "#a78bfa";

    ctx.fill();
  }

  function drawConductorGlow(
    ctx:
      CanvasRenderingContext2D,

    landmarks:
      Point[],

    width:
      number,

    height:
      number
  ) {
    const palm =
      getPalm(
        landmarks
      );

    const intensity =
      conductorIntensityRef.current;

    const x =
      palm.x *
      width;

    const y =
      palm.y *
      height;

    const radius =
      8 +
      intensity *
        7;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      radius,
      0,
      Math.PI *
        2
    );

    ctx.fillStyle =
      `rgba(167,139,250,${
        0.35 +
        intensity *
          0.35
      })`;

    ctx.shadowColor =
      "#8b5cf6";

    ctx.shadowBlur =
      18 +
      intensity *
        24;

    ctx.fill();

    ctx.shadowBlur =
      0;
  }

  /* =========================================================
     DETECTION
     ========================================================= */

  function detectHands() {
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    const tracker =
      handLandmarkerRef.current;

    if (
      !video ||
      !canvas ||
      !tracker
    ) {
      return;
    }

    if (
      video.readyState <
      2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          detectHands
        );

      return;
    }

    const width =
      video.videoWidth;

    const height =
      video.videoHeight;

    canvas.width =
      width;

    canvas.height =
      height;

    const ctx =
      canvas.getContext(
        "2d"
      );

    if (
      !ctx
    ) {
      return;
    }

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    const now =
      performance.now();

    const results =
      tracker.detectForVideo(
        video,
        now
      ) as HandResults;

    if (
      results.landmarks.length <
      2
    ) {
      twoHandsSinceRef.current =
        0;

      twoHandsStableRef.current =
        false;

      setMasterGate(
        false
      );

      updateConductorPresence(
        false
      );

      clearPlayingHand();

      resetHandLock();

      animationFrameRef.current =
        requestAnimationFrame(
          detectHands
        );

      return;
    }

    if (
      twoHandsSinceRef.current ===
      0
    ) {
      twoHandsSinceRef.current =
        now;

      setMasterGate(
        false
      );

      stopAllLayers();

      animationFrameRef.current =
        requestAnimationFrame(
          detectHands
        );

      return;
    }

    if (
      now -
        twoHandsSinceRef.current <
      160
    ) {
      setMasterGate(
        false
      );

      stopAllLayers();

      animationFrameRef.current =
        requestAnimationFrame(
          detectHands
        );

      return;
    }

    twoHandsStableRef.current =
      true;

    updateConductorPresence(
      true
    );

    const {
      playing,
      conductor,
    } =
      assignHands(
        results
      );

    if (
      playing
    ) {
      const rawIndex =
        playing.landmarks[8];

      const smoothed =
        smoothPoint(
          smoothedIndexTipRef.current,
          rawIndex,
          0.29
        );

      smoothedIndexTipRef.current =
        smoothed;

      const fingerX =
        1 -
        smoothed.x;

      const fingerY =
        smoothed.y;

      const neutral =
        fingerIsNeutral(
          fingerX,
          fingerY
        );

      const chord =
        neutral
          ? null
          : findHoveredChord(
              fingerX,
              fingerY
            );

      processChordCandidate(
        chord,
        neutral,
        now
      );

      drawPlayingCursor(
        ctx,
        smoothed,
        width,
        height
      );
    }

    if (
      conductor
    ) {
      processConductorDynamics(
        conductor.landmarks
      );

      const count =
        countExtendedFingers(
          conductor.landmarks
        );

      processConductorCount(
        count,
        now
      );

      drawConductorGlow(
        ctx,
        conductor.landmarks,
        width,
        height
      );
    }

    animationFrameRef.current =
      requestAnimationFrame(
        detectHands
      );
  }

  /* =========================================================
     CLEANUP
     ========================================================= */

  useEffect(
    () => {
      return () => {
        if (
          animationFrameRef.current !==
          null
        ) {
          cancelAnimationFrame(
            animationFrameRef.current
          );
        }

        stopAllLayers();

        streamRef.current
          ?.getTracks()
          .forEach(
            (
              track
            ) =>
              track.stop()
          );

        handLandmarkerRef.current
          ?.close();

        pianoRef.current
          ?.dispose();

        violinSustainRef.current
          ?.dispose();

        violaSustainRef.current
          ?.dispose();

        celloPizzRR1Ref.current
          ?.dispose();

        celloPizzRR2Ref.current
          ?.dispose();

        violinSpicRR1Ref.current
          ?.dispose();

        violinSpicRR2Ref.current
          ?.dispose();

        violinTremRef.current
          ?.dispose();

        hornRef.current
          ?.dispose();

        masterGainRef.current
          ?.dispose();

        limiterRef.current
          ?.dispose();
      };
    },
    []
  );

  /* =========================================================
     UI
     ========================================================= */

  return (
    <main className="app">

      <header className="topbar">

        <div className="branding">

          <h1>
            CHORD
            <span>
              SPACE
            </span>
          </h1>

          <p>
            Reach into music.
          </p>

        </div>

        <div className="topControls">

          <div className="keySelector">

            <span className="controlLabel">
              KEY
            </span>

            <select
              value={
                selectedKey
              }

              onChange={(
                event
              ) =>
                changeKey(
                  event.target.value
                )
              }
            >

              {Object.entries(
                KEY_DATA
              ).map(
                ([
                  key,
                  data,
                ]) => (

                  <option
                    key={
                      key
                    }

                    value={
                      key
                    }
                  >
                    {
                      data.label
                    }
                  </option>

                )
              )}

            </select>

          </div>

          <div className="layerSelector">

            <span className="controlLabel">
              ORCHESTRA
            </span>

            {[
              0,
              1,
              2,
              3,
              4,
              5,
            ].map(
              (
                count
              ) => (

                <button
                  key={
                    count
                  }

                  className={
                    activeLayerCount ===
                    count
                      ? "layerButton activeLayer"
                      : "layerButton"
                  }

                  onClick={() =>
                    changeLayerCount(
                      count
                    )
                  }
                >
                  {
                    count
                  }
                </button>

              )
            )}

          </div>

          <div className="handSelector">

            <span className="controlLabel">
              CHORD
            </span>

            <button
              className={
                playingHand ===
                "left"
                  ? "handOption activeHand"
                  : "handOption"
              }

              onClick={() =>
                changePlayingHand(
                  "left"
                )
              }
            >
              Left
            </button>

            <button
              className={
                playingHand ===
                "right"
                  ? "handOption activeHand"
                  : "handOption"
              }

              onClick={() =>
                changePlayingHand(
                  "right"
                )
              }
            >
              Right
            </button>

          </div>

          <div className="status">

            <span className="statusDot" />

            {
              status
            }

          </div>

        </div>

      </header>

      {/* CONDUCTOR */}

      <div
        className={
          conductorDetected
            ? "conductorPanel detected"
            : "conductorPanel"
        }
      >

        <div className="conductorHeading">

          <span className="conductorDot" />

          <div>

            <strong>
              CONDUCTOR
            </strong>

            <span>
              Fingers = layers • Height = dynamics
            </span>

          </div>

        </div>

        <div className="conductorCount">

          {conductorDetected
            ? observedFingerCount ??
              "—"
            : "—"}

          <small>

            {conductorDetected
              ? " fingers"
              : " show second hand"}

          </small>

        </div>

        {/* DYNAMICS */}

        <div
          style={{
            width:
              "100%",

            marginTop:
              "10px",

            marginBottom:
              "12px",

            padding:
              "10px 12px",

            borderRadius:
              "12px",

            background:
              "rgba(255,255,255,0.045)",

            border:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              marginBottom:
                "7px",

              fontSize:
                "11px",

              letterSpacing:
                "0.08em",
            }}
          >

            <span>
              DYNAMICS
            </span>

            <strong>

              {conductorDetected
                ? `${conductorIntensityPercent}% • ${getDynamicsLabel(
                    conductorIntensityPercent
                  )}`
                : "—"}

            </strong>

          </div>

          <div
            style={{
              height:
                "6px",

              width:
                "100%",

              borderRadius:
                "999px",

              overflow:
                "hidden",

              background:
                "rgba(255,255,255,0.09)",
            }}
          >

            <div
              style={{
                width:
                  conductorDetected
                    ? `${conductorIntensityPercent}%`
                    : "0%",

                height:
                  "100%",

                background:
                  "linear-gradient(90deg,#7c3aed,#c4b5fd)",

                transition:
                  "width 90ms linear",
              }}
            />

          </div>

        </div>

        <div className="orchestraLegend">

          <div
            className={
              activeLayerCount >=
              1
                ? "layerChip active"
                : "layerChip"
            }
          >
            <span className="layerNumber">
              1
            </span>

            Piano
          </div>

          <div
            className={
              activeLayerCount >=
              2
                ? "layerChip active"
                : "layerChip"
            }
          >
            <span className="layerNumber">
              2
            </span>

            Sustained Strings
          </div>

          <div
            className={
              activeLayerCount >=
              3
                ? "layerChip active"
                : "layerChip"
            }
          >
            <span className="layerNumber">
              3
            </span>

            Cello Pizzicato
          </div>

          <div
            className={
              activeLayerCount >=
              4
                ? "layerChip active"
                : "layerChip"
            }
          >
            <span className="layerNumber">
              4
            </span>

            Spiccato + Horn
          </div>

          <div
            className={
              activeLayerCount >=
              5
                ? "layerChip active"
                : "layerChip"
            }
          >
            <span className="layerNumber">
              5
            </span>

            Tremolo Orchestra
          </div>

        </div>

      </div>

      {/* CAMERA */}

      <section className="cameraStage">

        <video
          ref={
            videoRef
          }

          className="camera"

          muted

          playsInline
        />

        <canvas
          ref={
            canvasRef
          }

          className="overlay"
        />

        {cameraStarted && (

          <div className="chordLayer">

            {/* =============================================
                NEW CONNECTED CHORD WHEEL
                ============================================= */}

            <svg
              className="chordConnections"

              viewBox="0 0 100 100"

              preserveAspectRatio="none"

              style={{
                overflow:
                  "visible",
              }}
            >

              {chordLayout.map(
                (
                  chord,
                  index
                ) => {

                  const active =
                    hoveredChord ===
                    chord.name;

                  return (

                    <path
                      key={
                        chord.name
                      }

                      d={
                        getWheelSectorPath(
                          playingHand,
                          index
                        )
                      }

                      fill={
                        active
                          ? "rgba(167,139,250,0.46)"
                          : "rgba(25,22,34,0.58)"
                      }

                      stroke={
                        active
                          ? "rgba(221,214,254,0.95)"
                          : "rgba(255,255,255,0.16)"
                      }

                      strokeWidth={
                        active
                          ? 0.42
                          : 0.2
                      }

                      vectorEffect="non-scaling-stroke"

                      style={{
                        filter:
                          active
                            ? "drop-shadow(0 0 5px rgba(167,139,250,0.8))"
                            : "none",

                        transition:
                          "fill 100ms ease, stroke 100ms ease",
                      }}
                    />

                  );
                }
              )}

              {/* NEUTRAL CENTRE */}

              <ellipse
                cx={
                  wheelCenter.x *
                  100
                }

                cy={
                  wheelCenter.y *
                  100
                }

                rx={
                  WHEEL_RADIUS_X *
                  WHEEL_INNER_RADIUS *
                  100
                }

                ry={
                  WHEEL_RADIUS_Y *
                  WHEEL_INNER_RADIUS *
                  100
                }

                fill={
                  isNeutral
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(8,7,11,0.88)"
                }

                stroke={
                  isNeutral
                    ? "rgba(196,181,253,0.95)"
                    : "rgba(255,255,255,0.2)"
                }

                strokeWidth={
                  0.25
                }

                vectorEffect="non-scaling-stroke"
              />

            </svg>

            {/* =============================================
                CHORD LABELS
                ============================================= */}

            {chordLayout.map(
              (
                chord
              ) => {

                const active =
                  hoveredChord ===
                  chord.name;

                return (

                  <div
                    key={
                      `label-${chord.name}`
                    }

                    style={{
                      position:
                        "absolute",

                      left:
                        `${chord.x * 100}%`,

                      top:
                        `${chord.y * 100}%`,

                      transform:
                        "translate(-50%, -50%)",

                      minWidth:
                        "50px",

                      height:
                        "50px",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      borderRadius:
                        "999px",

                      fontSize:
                        active
                          ? "18px"
                          : "16px",

                      fontWeight:
                        750,

                      color:
                        active
                          ? "#ffffff"
                          : "rgba(255,255,255,0.82)",

                      textShadow:
                        active
                          ? "0 0 14px rgba(196,181,253,1)"
                          : "0 2px 8px rgba(0,0,0,0.8)",

                      pointerEvents:
                        "none",

                      transition:
                        "font-size 100ms ease",
                    }}
                  >

                    {
                      chord.name
                    }

                  </div>

                );
              }
            )}

            {/* NEUTRAL LABEL */}

            <div
              style={{
                position:
                  "absolute",

                left:
                  `${wheelCenter.x * 100}%`,

                top:
                  `${wheelCenter.y * 100}%`,

                transform:
                  "translate(-50%, -50%)",

                fontSize:
                  "9px",

                fontWeight:
                  700,

                letterSpacing:
                  "0.08em",

                color:
                  isNeutral
                    ? "#ffffff"
                    : "rgba(255,255,255,0.58)",

                textShadow:
                  "0 2px 8px rgba(0,0,0,0.8)",

                pointerEvents:
                  "none",
              }}
            >
              NEUTRAL
            </div>

            <div
              className="wheelHint"

              style={{
                left:
                  `${wheelCenter.x * 100}%`,
              }}
            >
              SLIDE AROUND THE RING • CENTRE TO STOP
            </div>

          </div>

        )}

        {!cameraStarted && (

          <div className="welcome">

            <div className="musicIcon">
              ♪
            </div>

            <h2>
              Conduct your orchestra.
            </h2>

            <p>
              One hand chooses harmony.
              The other builds and conducts the orchestra.
            </p>

            <button
              className="enterButton"

              onClick={
                startCamera
              }
            >
              Enter ChordSpace
            </button>

          </div>

        )}

      </section>

      <footer>
        ChordSpace • Spatial harmony & virtual orchestra
      </footer>

    </main>
  );
}

export default App;