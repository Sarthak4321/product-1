"use client";

import React, { useEffect, useRef } from "react";

interface PlasmaBall {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  baseRadius: number;
  color: string;
  colorEnd: string;
  phase: number;
}

export default function PlasmaHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // 6 dynamic organic plasma balls
    const balls: PlasmaBall[] = [
      {
        x: width * 0.2,
        y: height * 0.25,
        baseRadius: Math.max(220, Math.min(width, height) * 0.35),
        radius: Math.max(220, Math.min(width, height) * 0.35),
        vx: 0.5,
        vy: 0.3,
        color: "rgba(37, 99, 235, 0.35)", // Vivid Blue
        colorEnd: "rgba(59, 130, 246, 0)",
        phase: 0,
      },
      {
        x: width * 0.8,
        y: height * 0.22,
        baseRadius: Math.max(240, Math.min(width, height) * 0.38),
        radius: Math.max(240, Math.min(width, height) * 0.38),
        vx: -0.45,
        vy: 0.35,
        color: "rgba(139, 92, 246, 0.32)", // Violet
        colorEnd: "rgba(147, 51, 234, 0)",
        phase: Math.PI / 3,
      },
      {
        x: width * 0.5,
        y: height * 0.45,
        baseRadius: Math.max(260, Math.min(width, height) * 0.4),
        radius: Math.max(260, Math.min(width, height) * 0.4),
        vx: 0.35,
        vy: -0.3,
        color: "rgba(14, 165, 233, 0.32)", // Sky Cyan
        colorEnd: "rgba(6, 182, 212, 0)",
        phase: Math.PI / 2,
      },
      {
        x: width * 0.15,
        y: height * 0.65,
        baseRadius: Math.max(200, Math.min(width, height) * 0.3),
        radius: Math.max(200, Math.min(width, height) * 0.3),
        vx: 0.4,
        vy: -0.25,
        color: "rgba(99, 102, 241, 0.3)", // Indigo
        colorEnd: "rgba(79, 70, 229, 0)",
        phase: Math.PI,
      },
      {
        x: width * 0.85,
        y: height * 0.68,
        baseRadius: Math.max(220, Math.min(width, height) * 0.32),
        radius: Math.max(220, Math.min(width, height) * 0.32),
        vx: -0.35,
        vy: -0.35,
        color: "rgba(6, 182, 212, 0.28)", // Cyan
        colorEnd: "rgba(20, 184, 166, 0)",
        phase: (Math.PI * 3) / 2,
      },
      {
        x: width * 0.5,
        y: height * 0.15,
        baseRadius: Math.max(180, Math.min(width, height) * 0.25),
        radius: Math.max(180, Math.min(width, height) * 0.25),
        vx: -0.25,
        vy: 0.2,
        color: "rgba(236, 72, 153, 0.22)", // Soft Pink accent
        colorEnd: "rgba(244, 114, 182, 0)",
        phase: Math.PI / 4,
      },
    ];

    // Floating particles
    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1.2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let time = 0;

    const render = () => {
      time += 0.015;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Render plasma balls using standard alpha blending
      ctx.globalCompositeOperation = "source-over";

      balls.forEach((ball) => {
        ball.x += ball.vx + Math.sin(time + ball.phase) * 0.7;
        ball.y += ball.vy + Math.cos(time + ball.phase) * 0.7;

        // Subtle mouse reaction
        const dx = mouseX - ball.x;
        const dy = mouseY - ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 450 && dist > 10) {
          ball.x += (dx / dist) * 0.35;
          ball.y += (dy / dist) * 0.35;
        }

        // Soft bounce boundaries
        const pad = ball.baseRadius * 0.3;
        if (ball.x < -pad) ball.vx = Math.abs(ball.vx);
        if (ball.x > width + pad) ball.vx = -Math.abs(ball.vx);
        if (ball.y < -pad) ball.vy = Math.abs(ball.vy);
        if (ball.y > height + pad) ball.vy = -Math.abs(ball.vy);

        // Radius pulsing
        ball.radius = ball.baseRadius * (1 + 0.12 * Math.sin(time * 1.5 + ball.phase));

        // Draw radial glow
        const grad = ctx.createRadialGradient(
          ball.x,
          ball.y,
          0,
          ball.x,
          ball.y,
          ball.radius
        );
        grad.addColorStop(0, ball.color);
        grad.addColorStop(0.6, ball.color.replace(/[\d\.]+\)$/, "0.12)"));
        grad.addColorStop(1, ball.colorEnd);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw particle sparks
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(59, 130, 246, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Dynamic Animated Canvas Plasma Balls */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block filter blur-[40px] sm:blur-[55px]"
      />

      {/* Additional CSS Ambient Plasma Glow Blobs for ultra rich depth */}
      <div className="absolute -top-12 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[90px] animate-plasma-1" />
      <div className="absolute top-1/4 right-1/4 w-[420px] h-[420px] bg-indigo-400/20 rounded-full blur-[100px] animate-plasma-2" />
      <div className="absolute top-1/2 left-1/3 w-[380px] h-[380px] bg-cyan-400/18 rounded-full blur-[95px] animate-plasma-3" />

      {/* Tech Dot Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#94A3B8_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-35 [mask-image:radial-gradient(ellipse_80%_65%_at_50%_35%,#000_60%,transparent_100%)]" />

      {/* Bottom Fade Mask into next section */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </div>
  );
}
