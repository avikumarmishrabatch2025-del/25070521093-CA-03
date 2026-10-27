import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NODE_COUNT = 80;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function createNetwork() {
  const nodes = [];
  for (let index = 0; index < NODE_COUNT; index += 1) {
    const angle = index * GOLDEN_ANGLE;
    const spread = 2.4 + (index % 9) * 0.55;
    nodes.push(new THREE.Vector3(
      Math.cos(angle) * spread,
      Math.sin(angle * 0.73) * (1.4 + (index % 5) * 0.48),
      Math.sin(angle) * 2.8 - 1.5
    ));
  }

  const segments = [];
  for (let a = 0; a < nodes.length; a += 1) {
    for (let b = a + 1; b < nodes.length; b += 1) {
      if (nodes[a].distanceToSquared(nodes[b]) < 2.8 && segments.length < 240) {
        segments.push(...nodes[a].toArray(), ...nodes[b].toArray());
      }
    }
  }

  return {
    points: new Float32Array(nodes.flatMap(node => node.toArray())),
    lines: new Float32Array(segments)
  };
}

export default function AmbientBackground({ motion = true }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldMove = motion && !reduceMotion;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch {
      host.dataset.webgl = 'fallback';
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25) * 0.75);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x101322, 0.012);
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 60);
    camera.position.set(0, 0, 10);

    const world = new THREE.Group();
    scene.add(world);
    const { points, lines } = createNetwork();

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const pointCloud = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
      color: 0x9ed2ff, size: 0.11, transparent: true, opacity: 0.9, sizeAttenuation: true
    }));
    world.add(pointCloud);

    const glow = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
      color: 0x5ea7ff, size: 0.32, transparent: true, opacity: 0.22, sizeAttenuation: true
    }));
    world.add(glow);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(lines, 3));
    const network = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
      color: 0x5ea7ff, transparent: true, opacity: 0.28
    }));
    world.add(network);

    const orbit = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.35, 1),
      new THREE.MeshBasicMaterial({ color: 0x6aa9ff, wireframe: true, transparent: true, opacity: 0.16 })
    );
    orbit.position.set(3.8, 0.2, -2.8);
    world.add(orbit);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.7, 0.015, 6, 128),
      new THREE.MeshBasicMaterial({ color: 0x8cc8ff, transparent: true, opacity: 0.24 })
    );
    ring.position.set(-4.2, 1.5, -3.5);
    ring.rotation.set(1.05, 0.3, -0.4);
    world.add(ring);

    const pointer = { x: 0, y: 0 };
    let scrollProgress = 0;
    const onPointer = event => {
      pointer.x = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 0.5;
      pointer.y = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 0.3;
    };
    const onScroll = () => {
      scrollProgress = Math.min(1, Math.max(0,
        window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      ));
    };

    if (shouldMove) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
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
      if (!running || !shouldMove) return;
      const now = performance.now();
      if (now - lastRender < frameInterval) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastRender = now;
      const time = clock.getElapsedTime();
      world.rotation.y += ((time * 0.025 + pointer.x + scrollProgress * 0.16) - world.rotation.y) * 0.025;
      world.rotation.x += ((-pointer.y + scrollProgress * 0.06) - world.rotation.x) * 0.025;
      world.position.y = Math.sin(time * 0.22) * 0.12 - scrollProgress * 0.35;
      orbit.rotation.x = time * 0.035;
      orbit.rotation.y = -time * 0.045;
      ring.rotation.z = -0.4 + time * 0.018;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    };
    const onVisibility = () => {
      running = !document.hidden;
      cancelAnimationFrame(frame);
      if (running) {
        clock.getDelta();
        if (shouldMove && !degraded) draw();
        else renderer.render(scene, camera);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    host.dataset.quality = shouldMove ? 'animated' : 'static';
    if (shouldMove) draw();
    else {
      world.rotation.set(-0.06, 0.2, 0);
      renderer.render(scene, camera);
    }
    host.dataset.webgl = 'ready';

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
  }, [motion]);

  return <div className="ambient-background" ref={hostRef} aria-hidden="true">
    <div className="ambient-poster"><span/><span/><i/></div>
  </div>;
}
