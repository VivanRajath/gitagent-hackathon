/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// Hand skeleton connections
const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],[0,17],
];

function detectGesture(lm: any[]): string {
  const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
  if (pinchDist < 0.05) return 'pinch';

  const iExt = lm[8].y  < lm[6].y;
  const mExt = lm[12].y < lm[10].y;
  const rExt = lm[16].y < lm[14].y;
  const pExt = lm[20].y < lm[18].y;
  const tUp  = lm[4].y  < lm[3].y;

  if (iExt && mExt && rExt && pExt)                  return 'open';
  if (!iExt && !mExt && !rExt && !pExt)              return tUp ? 'thumbs_up' : 'fist';
  if (iExt && mExt && !rExt && !pExt)                return 'peace';
  if (iExt && !mExt && !rExt && !pExt)               return 'point';
  return 'point';
}

export type Gesture = 'point' | 'pinch' | 'peace' | 'fist' | 'open' | 'thumbs_up';

interface Props {
  onCursorMove: (x: number, y: number) => void;
  onPinch: (isPinching: boolean) => void;
  onGesture?: (gesture: Gesture) => void;
  /** Show video feed + skeleton overlay (gesture mode). When false, tracking still runs but feed is hidden. */
  showFeed?: boolean;
}

export default function HandTracker({ onCursorMove, onPinch, onGesture, showFeed = true }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);

  // Stable refs for callbacks — effect runs once, callbacks never cause re-init
  const onCursorMoveRef = useRef(onCursorMove);
  const onPinchRef      = useRef(onPinch);
  const onGestureRef    = useRef(onGesture);
  useEffect(() => { onCursorMoveRef.current = onCursorMove; }, [onCursorMove]);
  useEffect(() => { onPinchRef.current      = onPinch;      }, [onPinch]);
  useEffect(() => { onGestureRef.current    = onGesture;    }, [onGesture]);

  // Smoothing state (EMA)
  const smoothX   = useRef(0);
  const smoothY   = useRef(0);
  const ALPHA     = 0.22;   // 0 = frozen, 1 = raw — 0.22 is responsive but not jittery

  // Gesture debounce
  const lastGesture   = useRef<Gesture>('point');
  const gestureFrames = useRef(0);
  const GESTURE_FRAMES = 3;  // must hold gesture this many frames before firing

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let active    = true;
    let landmarker: any = null;
    let stream: MediaStream | null = null;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const video = videoRef.current!;
      video.srcObject = stream;
      video.addEventListener('loadeddata', loop);
    }

    let lastVideoTime = -1;

    function loop() {
      if (!active || !landmarker) return;
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay) { requestAnimationFrame(loop); return; }

      // Sync overlay canvas to window size each frame (handles resize)
      if (overlay.width !== window.innerWidth)   overlay.width  = window.innerWidth;
      if (overlay.height !== window.innerHeight) overlay.height = window.innerHeight;

      const ctx = overlay.getContext('2d')!;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      const now = performance.now();
      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = landmarker.detectForVideo(video, now);

        if (results.landmarks?.length > 0) {
          const lm = results.landmarks[0];

          // ── EMA smoothing ──────────────────────────────────────────────
          const rawX = (1 - lm[8].x) * window.innerWidth;
          const rawY = lm[8].y * window.innerHeight;
          smoothX.current += ALPHA * (rawX - smoothX.current);
          smoothY.current += ALPHA * (rawY - smoothY.current);
          onCursorMoveRef.current(smoothX.current, smoothY.current);

          // ── Gesture debounce ───────────────────────────────────────────
          const g = detectGesture(lm) as Gesture;
          onPinchRef.current(g === 'pinch');
          if (g === lastGesture.current) {
            gestureFrames.current++;
            if (gestureFrames.current === GESTURE_FRAMES) onGestureRef.current?.(g);
          } else {
            lastGesture.current = g;
            gestureFrames.current = 0;
          }

          // ── Draw skeleton on overlay canvas ────────────────────────────
          const sw = overlay.width;
          const sh = overlay.height;
          const px = (x: number) => (1 - x) * sw;  // mirrored
          const py = (y: number) => y * sh;

          // Connections
          ctx.lineWidth = 2;
          CONNECTIONS.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 255, 140, 0.55)';
            ctx.moveTo(px(lm[a].x), py(lm[a].y));
            ctx.lineTo(px(lm[b].x), py(lm[b].y));
            ctx.stroke();
          });

          // Landmark dots
          lm.forEach((p: any, i: number) => {
            const x = px(p.x);
            const y = py(p.y);
            let r = 3, color = 'rgba(0,255,140,0.75)';
            if (i === 8)  { r = 8;  color = 'rgba(255,60,60,0.95)'; }   // index tip
            else if (i === 4) { r = 7; color = 'rgba(80,140,255,0.9)'; } // thumb tip
            else if ([0,5,9,13,17].includes(i)) { r = 4; }
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          });

          // Pinch line between thumb and index
          if (g === 'pinch') {
            ctx.beginPath();
            ctx.moveTo(px(lm[4].x), py(lm[4].y));
            ctx.lineTo(px(lm[8].x), py(lm[8].y));
            ctx.strokeStyle = 'rgba(220, 80, 255, 0.85)';
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          // Gesture label next to index tip
          if (g !== 'point') {
            ctx.font = 'bold 13px monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            const label = g.replace('_', ' ');
            const tx = px(lm[8].x) + 14;
            const ty = py(lm[8].y) - 4;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(tx - 3, ty - 13, ctx.measureText(label).width + 6, 18);
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.fillText(label, tx, ty);
          }
        }
      }

      requestAnimationFrame(loop);
    }

    init().catch(console.error);

    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []); // stable — callbacks accessed via refs, never cause re-init

  return (
    <>
      {/* Webcam feed — visible only in gesture mode */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
        style={{
          zIndex: 0,
          transform: 'scaleX(-1)',
          opacity: showFeed ? 0.32 : 0,
          visibility: showFeed ? 'visible' : 'hidden',
        }}
      />

      {/* Hand skeleton overlay — visible only in gesture mode */}
      <canvas
        ref={overlayRef}
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          zIndex: 9999,
          opacity: showFeed ? 1 : 0,
          visibility: showFeed ? 'visible' : 'hidden',
        }}
      />
    </>
  );
}
