"use client";

import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { GLSLHills } from './glsl-hills';

// --- Main Hero Component ---
export const GravitationalMeshHero = () => {
  const textControls = useAnimation();
  const buttonControls = useAnimation();

  useEffect(() => {
    textControls.start(i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05 + 1.5,
        duration: 1.2,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    }));
    buttonControls.start({
        opacity: 1,
        transition: { delay: 2.5, duration: 1 }
    });
  }, [textControls, buttonControls]);

  const headline = "Master Your Funded Account Journey";

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#030303]">
      <GLSLHills />
      {/* <MeshCanvas /> */} {/* Removed purple circle grid */}
      <div className="absolute top-48 left-1/2 transform -translate-x-1/2 z-10 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1.2, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl whitespace-nowrap"
          style={{ textShadow: '0 0 50px rgba(0, 0, 0, 0.1)' }}
        >
          {headline}
        </motion.h1>
        <motion.p
          custom={headline.length}
          initial={{ opacity: 0, y: 30 }}
          animate={textControls}
          className="mx-auto mt-4 max-w-xl text-xl text-cyan-300 font-light"
        >
          "Where Trading Meets Risk Control"
        </motion.p>
        <motion.p
          custom={headline.length + 30}
          initial={{ opacity: 0, y: 30 }}
          animate={textControls}
          className="mx-auto mt-6 max-w-xl text-lg text-slate-300"
        >
          Professional clearing service for prop firm challenges with custom trading plans and expert guidance
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
          animate={buttonControls}
          initial={{ opacity: 0 }}
        >
          <Link
            to="/membership"
            className="group relative px-8 py-4 rounded-full bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-300 backdrop-blur-sm"
          >
            <span className="relative z-10 flex items-center gap-2 text-white/90 font-light">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

// --- Three.js Canvas Component ---
const MeshCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 10;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // --- Gravitational Mesh ---
    const geometry = new THREE.PlaneGeometry(40, 40, 50, 50);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0,0) },
            uColor: { value: new THREE.Color(isDarkMode ? 0xa0a0ff : 0x404080) }
        },
        vertexShader: `
            uniform float uTime;
            uniform vec2 uMouse;
            varying float vIntensity;

            void main() {
                vec3 pos = position;
                float mouseDist = distance(pos.xy, uMouse * 20.0);

                float warp = 1.0 - smoothstep(0.0, 5.0, mouseDist);
                pos.z += warp * 3.0;
                vIntensity = warp;

                pos.z += sin(pos.x * 0.5 + uTime * 0.5) * 0.1;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            varying float vIntensity;
            void main() {
                gl_FragColor = vec4(uColor * vIntensity, vIntensity * 0.8);
            }
        `,
        wireframe: true,
        transparent: true,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleMouseMove = (event: MouseEvent) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        material.uniforms.uTime.value = elapsedTime;
        material.uniforms.uMouse.value.lerp(mouse, 0.05);

        mesh.rotation.x = -0.2;

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};
