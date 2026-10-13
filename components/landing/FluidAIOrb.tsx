"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// GLSL Smooth Minimal Simplex 3D Noise Vertex Shader
const vertexShader = `
  uniform float uTime;
  uniform float uNoiseFreq;
  uniform float uNoiseAmp;
  uniform float uSpeed;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vUv = uv;
    vPosition = position;
    
    // Smooth, gentle fluid motion (spherical shape preserved)
    float time = uTime * uSpeed;
    float noise1 = snoise(position * uNoiseFreq + vec3(time * 0.35, time * 0.25, time * 0.15));
    float noise2 = snoise(position * (uNoiseFreq * 2.0) + vec3(-time * 0.2, time * 0.3, 0.0)) * 0.35;
    
    float totalNoise = (noise1 + noise2) * uNoiseAmp;
    vDisplacement = totalNoise;

    vec3 newPosition = position + normal * totalNoise;
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// GLSL Fragment Shader: Minimal, Translucent Glass Sphere with Elegant Blue/Cyan Rim Glow
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorBlue;
  uniform vec3 uColorCyan;
  uniform vec3 uColorSky;
  uniform vec3 uColorCore;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Fresnel Rim Glow effect (focused strictly on outer edges)
    float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
    float rim = pow(fresnel, 3.2);

    // Smooth specular highlights
    vec3 lightDir = normalize(vec3(0.8, 1.2, 1.0));
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 36.0);

    // Smooth color flow along circumference
    float angle = atan(vPosition.y, vPosition.x);
    float flow = sin(angle + uTime * 0.3) * 0.5 + 0.5;

    // Theme Blue-Cyan-Sky rim color
    vec3 rimColor = mix(uColorBlue, uColorCyan, flow);
    rimColor = mix(rimColor, uColorSky, clamp(vPosition.y * 0.5 + 0.5, 0.0, 1.0));

    // Core is crystal clear white for 100% text readability
    vec3 finalColor = mix(vec3(1.0, 1.0, 1.0), rimColor, rim * 0.95);
    finalColor += vec3(1.0, 1.0, 1.0) * (spec * 0.35);

    // Alpha is 0 in the center so text has ZERO background interference, and glows at rim
    float alpha = pow(fresnel, 2.5) * 0.85 + spec * 0.25;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export default function FluidAIOrb({
  className = "",
  size = 640,
}: {
  className?: string;
  size?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.z = 4.3;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Smooth sphere geometry
    const geometry = new THREE.IcosahedronGeometry(1.4, 64);

    // Blue Theme Uniforms (Minimal, Calm & Organic)
    const uniforms = {
      uTime: { value: 0 },
      uNoiseFreq: { value: 0.7 },
      uNoiseAmp: { value: 0.08 }, // Subtle, gentle fluid breathing
      uSpeed: { value: 0.45 },    // Relaxed, premium pace
      uColorBlue: { value: new THREE.Color("#2563EB") },  // Brand Royal Blue
      uColorCyan: { value: new THREE.Color("#06B6D4") },  // Bright Cyan
      uColorSky: { value: new THREE.Color("#60A5FA") },   // Soft Sky Blue
      uColorCore: { value: new THREE.Color("#FFFFFF") },  // Pure Clean White Core
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse Tracking for smooth natural 3D tilt
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      targetRotationY = x * 0.35;
      targetRotationX = -y * 0.35;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      uniforms.uTime.value = elapsedTime;

      // Smooth subtle rotation + slow continuous drift
      mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.03 + 0.002;
      mesh.rotation.x += (targetRotationX - mesh.rotation.x) * 0.03;
      mesh.rotation.z = Math.sin(elapsedTime * 0.3) * 0.04;

      // Gentle vertical floating bob
      mesh.position.y = Math.sin(elapsedTime * 0.7) * 0.04;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
