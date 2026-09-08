import { useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

import "./App.css";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [status, setStatus] = useState("Ready");
  const [cameraStarted, setCameraStarted] = useState(false);

  async function loadHandTracker() {
    setStatus("Loading hand tracker...");

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );

    const handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },

      runningMode: "VIDEO",
      numHands: 1,

      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    handLandmarkerRef.current = handLandmarker;
  }

  async function startCamera() {
    try {
      await loadHandTracker();

      setStatus("Requesting camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) return;

      video.srcObject = stream;

      await video.play();

      setCameraStarted(true);
      setStatus("Show me your hand 👋");

      detectHands();
    } catch (error) {
      console.error(error);
      setStatus("Camera or hand tracking failed");
    }
  }

  function detectHands() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const handLandmarker = handLandmarkerRef.current;

    if (!video || !canvas || !handLandmarker) return;

    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const results = handLandmarker.detectForVideo(
      video,
      performance.now()
    );

    if (results.landmarks.length > 0) {
      const drawingUtils = new DrawingUtils(ctx);

      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          HandLandmarker.HAND_CONNECTIONS,
          {
            color: "#c4b5fd",
            lineWidth: 4,
          }
        );

        drawingUtils.drawLandmarks(landmarks, {
          color: "#ffffff",
          fillColor: "#8b5cf6",
          lineWidth: 2,
          radius: 5,
        });

        const indexTip = landmarks[8];

        const x = indexTip.x * width;
        const y = indexTip.y * height;

        ctx.beginPath();
        ctx.arc(x, y, 17, 0, Math.PI * 2);

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#c4b5fd";
        ctx.shadowBlur = 25;

        ctx.fill();

        ctx.shadowBlur = 0;
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectHands);
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      handLandmarkerRef.current?.close();
    };
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>
            CHORD<span>SPACE</span>
          </h1>

          <p>Reach into music.</p>
        </div>

        <div className="status">
          <span className="statusDot"></span>
          {status}
        </div>
      </header>

      <section className="cameraStage">
        <video
          ref={videoRef}
          className="camera"
          muted
          playsInline
        />

        <canvas
          ref={canvasRef}
          className="overlay"
        />

        {!cameraStarted && (
          <div className="welcome">
            <div className="musicIcon">♪</div>

            <h2>Your hands are the instrument.</h2>

            <p>
              Use your webcam to reach into virtual chord spaces
              and create music.
            </p>

            <button onClick={startCamera}>
              Enter ChordSpace
            </button>
          </div>
        )}
      </section>

      <footer>
        ChordSpace • Experimental spatial instrument
      </footer>
    </main>
  );
}

export default App;