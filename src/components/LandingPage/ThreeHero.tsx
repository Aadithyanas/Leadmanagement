import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ThreeHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Geometry - A floating network of points
    const particlesCount = 1500;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Material
    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x8b5cf6, // Violet-600
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    // Points
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - width / 2) / 100;
      mouseY = (event.clientY - height / 2) / 100;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      points.rotation.y += 0.002;
      points.rotation.x += 0.001;

      // Subtle parallax based on mouse
      points.position.x += (mouseX - points.position.x) * 0.05;
      points.position.y += (-mouseY - points.position.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white/40 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl max-w-sm">
             <div className="h-2 w-24 bg-violet-600 rounded-full mx-auto mb-4 animate-pulse" />
             <p className="text-xl font-black text-slate-900 tracking-tight">REAL-TIME DATA STREAM</p>
             <p className="text-sm text-slate-500 font-medium mt-2">Connecting 1,500+ global data nodes per second.</p>
          </div>
       </div>
    </div>
  );
}
