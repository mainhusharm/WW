// src/components/ui/wavy-shader-animation.tsx
"use client";

import React, { useEffect, useRef, FC } from "react";
import * as THREE from "three";

export interface WavyShaderProps {
  /** How much to increment `time` each frame */
  speed?: number;
  /** Extra CSS classes on the wrapper */
  className?: string;
  /** ARIA label for the canvas region */
  ariaLabel?: string;
}

const WavyShader: FC<WavyShaderProps> = ({
  speed      = 0.01,
  className  = "",
  ariaLabel  = "Wavy shader animation",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Three.js Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- Shader Material ---
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      time:       { value: 0.0 },
      resolution: { value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec2 resolution;
        uniform float time;

        #define T mod(2.*time,180.)
        #define S smoothstep

        float rnd(float a){return fract(sin(a*12.233)*78.599);}
        float rnd(vec2 p){return fract(sin(dot(p,p.yx+vec2(234,543)))*345678.);}

        float curve(float a,float b){
          a/=b;
          return mix(rnd(floor(a)), rnd(floor(a)+1.),
            pow(S(0.,1.,fract(a)),10.));
        }

        mat2 rot(float a){
          float s=sin(a), c=cos(a);
          return mat2(c,-s,s,c);
        }

        float map(vec3 p){
          if(p.y>0.28||p.z>15.) return 5e5;
          float d = p.y + (1.-cos(sin(T+6.3*p.x)))*.1;
          d += 1.-pow(cos(.75*sin(T+curve(T*.5,8.)+
                   2.*(1.+curve(T*2.5,14.4))*
                   (p.xz*rot(.125)).x)),2.);
          d += 1.-cos(curve(T*.2,8.)+
                   sin(T+.8*(p.xz*rot(.38)).x))*.1;
          d += 1.2*sin(p.z*.4+sin(p.x*.6+1.2));
          d = max(d, -p.z);
          return d * .5;
        }

        vec3 norm(vec3 p){
          vec2 e = vec2(1e-3,0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)
          ));
        }

        void cam(inout vec3 p){
          p.xz *= rot(sin(T*.2)*.2);
        }

        void main(){
          vec2 uv = (gl_FragCoord.xy - .5*resolution)/
                    min(resolution.x,resolution.y);
          vec3 col = vec3(0), p = vec3(0,0,-3),
               rd = normalize(vec3(uv,1.));

          cam(p);
          cam(rd);

          const float steps = 400., maxd = 15.;
          float distAccum = 0., difF = mix(.75,1.,rnd(p.xz));

          for(float i = 0.; i < steps; i++){
            float d = map(p) * difF;
            if(d < 1e-3) break;
            if(d > maxd){ distAccum = maxd; break; }
            p += rd * d;
            distAccum += d;
          }

          vec3 n = norm(p);
          vec3 lightDir = normalize(vec3(0,10,-.1));
          float diff = max(dot(n, lightDir), 0.);
          float fres = 1. + max(dot(-rd, n), 0.);

          col += vec3(0.1, 0.3, 0.4); // cyan-blue base instead of brown
          col += .3 * pow(fres, 2.8) * diff; // brighter cyan highlights
          col *= mix(col, vec3(0),
            1. - exp(-125e-5 * distAccum*distAccum*distAccum));

          gl_FragColor = vec4(col, 1.);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- Resize Handler ---
    const onResize = () => {
      const width  = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.resolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height
      );
    };
    window.addEventListener("resize", onResize);
    onResize();

    // --- Animation Loop ---
    let animationId: number;
    const animate = () => {
      uniforms.time.value += speed;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // --- Cleanup on Unmount ---
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);

      // Remove canvas and dispose resources
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      role="region"
      aria-label={ariaLabel}
      style={{ background: "#000", overflow: "hidden" }}
    />
  );
};

export default WavyShader;
