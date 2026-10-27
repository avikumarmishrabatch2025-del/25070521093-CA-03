import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FinanceScene({ compact = false, motion = true }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldMove = motion && !reduceMotion;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      host.dataset.fallback = 'true';
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.2, compact ? 8.6 : 9.4);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const world = new THREE.Group();
    scene.add(world);
    const azure = new THREE.Color('#6aa9ff');
    const chalk = new THREE.Color('#dceaff');
    const charcoal = new THREE.Color('#1a2542');

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(compact ? 1.1 : 1.42, 2),
      new THREE.MeshStandardMaterial({ color: charcoal, metalness: 0.78, roughness: 0.24, flatShading: true })
    );
    world.add(core);
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(compact ? 1.16 : 1.5, 2),
      new THREE.MeshBasicMaterial({ color: azure, wireframe: true, transparent: true, opacity: 0.32 })
    );
    world.add(wire);

    const rings = Array.from({ length: 3 }, (_, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2 + index * 0.36, 0.018 + index * 0.006, 8, 120),
        new THREE.MeshBasicMaterial({ color: index === 1 ? chalk : azure, transparent: true, opacity: 0.46 - index * 0.08 })
      );
      ring.rotation.set(Math.PI * (0.18 + index * 0.19), Math.PI * (0.12 + index * 0.22), index * 0.6);
      world.add(ring);
      return ring;
    });

    const satellites = Array.from({ length: 7 }, (_, index) => {
      const pivot = new THREE.Group();
      const angle = (index / 7) * Math.PI * 2;
      const radius = 2.15 + (index % 3) * 0.34;
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.07 + (index % 2) * 0.035, 16, 16),
        new THREE.MeshBasicMaterial({ color: index % 3 === 0 ? chalk : azure })
      );
      dot.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * 2) * 0.5);
      pivot.rotation.x = angle * 0.35;
      pivot.add(dot);
      world.add(pivot);
      return pivot;
    });

    const bars = new THREE.Group();
    Array.from({ length: 9 }, (_, index) => {
      const height = 0.28 + (Math.sin(index * 1.7) + 1) * 0.34;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, height, 0.13),
        new THREE.MeshStandardMaterial({ color: index > 5 ? azure : chalk, metalness: 0.35, roughness: 0.5 })
      );
      const angle = (index / 9) * Math.PI * 2;
      bar.position.set(Math.cos(angle) * 2.75, -2.25 + height / 2, Math.sin(angle) * 0.8);
      bars.add(bar);
      return bar;
    });
    bars.rotation.z = -0.08;
    world.add(bars);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(azure, 18, 16);
    rim.position.set(-3, -1, 4);
    scene.add(rim);

    const pointer = { x: 0, y: 0 };
    let scrollProgress = 0;
    const onPointer = event => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.7;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.45;
    };
    const onScroll = () => {
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)));
    };
    if (shouldMove) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    let running = true;
    let lastRender = 0;
    const frameInterval = 1000 / 30;
    const clock = new THREE.Clock();
    const draw = () => {
      if (!running) return;
      const now = performance.now();
      if (now - lastRender < frameInterval) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastRender = now;
      const t = clock.getElapsedTime();
      world.rotation.y += ((t * 0.16 + pointer.x + scrollProgress * 0.8) - world.rotation.y) * 0.035;
      world.rotation.x += ((-0.12 - pointer.y + scrollProgress * 0.18) - world.rotation.x) * 0.04;
      world.position.y = Math.sin(t * 0.72) * 0.1;
      rings.forEach((ring, index) => { ring.rotation.z = t * (0.055 + index * 0.025) + index; });
      satellites.forEach((pivot, index) => { pivot.rotation.z = t * (0.08 + index * 0.008); });
      wire.rotation.y = -t * 0.12;
      camera.position.z = (compact ? 8.6 : 9.4) - scrollProgress * 0.45;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    };
    const onVisibility = () => {
      running = !document.hidden;
      if (running && shouldMove && !degraded) { clock.start(); draw(); }
      else {
        cancelAnimationFrame(frame);
        if (running) renderer.render(scene, camera);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    host.dataset.quality = shouldMove ? 'animated' : 'static';
    if (shouldMove) draw();
    else { world.rotation.set(-0.15, 0.45, 0); renderer.render(scene, camera); }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      scene.traverse(object => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [compact, motion]);

  return <div className={`finance-scene ${compact ? 'scene-compact' : ''}`} ref={hostRef} aria-hidden="true">
    <div className="scene-poster"><span/><span/><span/><i/></div>
  </div>;
}
