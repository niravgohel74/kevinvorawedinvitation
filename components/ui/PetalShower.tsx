"use client";
import React, { useEffect, useRef, useState } from "react";

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  flipX: number;
  flipXSpeed: number;
  flipY: number;
  flipYSpeed: number;
  swayAmplitude: number;
  swayFrequency: number;
  swayOffset: number;
  color: {
    base: string;
    shadow: string;
    highlight: string;
  };
  opacity: number;
}

const PETAL_PALETTES = [
  // Deep Crimson Rose
  {
    base: "#B52B44",
    shadow: "#7D182B",
    highlight: "#D94E66",
  },
  // Soft Rose Pink
  {
    base: "#D85B75",
    shadow: "#A1344B",
    highlight: "#F391A5",
  },
  // Blush Peony
  {
    base: "#E89AA8",
    shadow: "#BA6776",
    highlight: "#FCE4E8",
  },
  // Golden Saffron Marigold (Genda)
  {
    base: "#E88A1A",
    shadow: "#B25E0B",
    highlight: "#F7B844",
  },
  // Sunshine Marigold Yellow
  {
    base: "#F4B223",
    shadow: "#C28308",
    highlight: "#FCE282",
  },
  // Ivory Jasmine / Mogra with Gold Hue
  {
    base: "#F2E8D5",
    shadow: "#D0C2A7",
    highlight: "#FFFFFF",
  },
];

export function PetalShower({ density = 36 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const petalsRef = useRef<Petal[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!isEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Create random petal
    const createPetal = (startY?: number): Petal => {
      const palette = PETAL_PALETTES[Math.floor(Math.random() * PETAL_PALETTES.length)];
      return {
        x: Math.random() * width,
        y: startY !== undefined ? startY : Math.random() * height,
        size: 11 + Math.random() * 14,
        speedY: 0.8 + Math.random() * 1.5,
        speedX: (Math.random() - 0.5) * 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.025,
        flipX: Math.random() * Math.PI * 2,
        flipXSpeed: 0.015 + Math.random() * 0.03,
        flipY: Math.random() * Math.PI * 2,
        flipYSpeed: 0.01 + Math.random() * 0.02,
        swayAmplitude: 0.8 + Math.random() * 1.4,
        swayFrequency: 0.012 + Math.random() * 0.018,
        swayOffset: Math.random() * Math.PI * 2,
        color: palette,
        opacity: 0.55 + Math.random() * 0.35,
      };
    };

    // Initialize petals array
    const targetCount = Math.min(density, Math.floor((width * height) / 28000));
    petalsRef.current = Array.from({ length: targetCount }, () => createPetal());

    let tick = 0;

    // Draw single realistic petal using Bezier curve
    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // 3D perspective tumbling illusion
      const scaleX = Math.cos(p.flipX);
      const scaleY = Math.cos(p.flipY);
      ctx.scale(scaleX, scaleY);

      ctx.globalAlpha = p.opacity;

      const w = p.size;
      const h = p.size * 1.45;

      // Petal body gradient
      const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      grad.addColorStop(0, p.color.highlight);
      grad.addColorStop(0.3, p.color.base);
      grad.addColorStop(1, p.color.shadow);

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Curved organic petal shape
      ctx.moveTo(0, -h / 2);
      ctx.bezierCurveTo(w / 1.7, -h / 3, w / 1.5, h / 3, 0, h / 2);
      ctx.bezierCurveTo(-w / 1.5, h / 3, -w / 1.7, -h / 3, 0, -h / 2);
      ctx.closePath();
      ctx.fill();

      // Subtle delicate center vein
      ctx.strokeStyle = p.color.shadow;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = p.opacity * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2.5);
      ctx.quadraticCurveTo(w * 0.08, 0, 0, h / 2.3);
      ctx.stroke();

      ctx.restore();
    };

    // Render loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      tick++;

      const petals = petalsRef.current;
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // Physics update
        p.y += p.speedY;
        p.x += Math.sin(tick * p.swayFrequency + p.swayOffset) * p.swayAmplitude + p.speedX;
        p.rotation += p.rotationSpeed;
        p.flipX += p.flipXSpeed;
        p.flipY += p.flipYSpeed;

        // Reset if drifted off-screen
        if (p.y > height + 40) {
          petals[i] = createPetal(-30);
        }
        if (p.x < -40) {
          p.x = width + 20;
        } else if (p.x > width + 40) {
          p.x = -20;
        }

        drawPetal(p);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isEnabled, density]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 w-full h-full"
      style={{ mixBlendMode: "multiply", opacity: 0.88 }}
      aria-hidden="true"
    />
  );
}
