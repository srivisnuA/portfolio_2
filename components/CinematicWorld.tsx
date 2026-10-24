"use client";

import { Component, type MutableRefObject, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addAfterEffect, Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ProjectLandmarks from "./ProjectLandmarks";
import WorldDetails from "./WorldDetails";
import { advanceTravel, landmarkIndexForStop, LAST_STOP, nearestStop, seededRandom, stationPosition, STOP_SPACING, type TravelState } from "@/lib/world";
import { initialRenderQuality, islandWindow, type RenderQuality } from "@/lib/render-quality";

export type WorldProps = {
  travel: MutableRefObject<TravelState>;
  markerElements: MutableRefObject<(HTMLButtonElement | null)[]>;
  onProgress: (progress: number) => void;
  onReady: () => void;
  onUnavailable: () => void;
};

const palette = ["#e5c58c", "#7ddbd6", "#f0bc79", "#bca7f1", "#ef9e79", "#82d4cb", "#b0cce6", "#dfd6b6", "#e7b77b", "#c9dced"];

function createGlow() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const radius = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
    const offset = (y * size + x) * 4;
    data[offset] = data[offset + 1] = data[offset + 2] = 255;
    data[offset + 3] = Math.round(Math.max(0, Math.exp(-radius * radius * 6) - Math.exp(-6)) * 255);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
}

function islandGeometry(seed: number, radius: number, index: number, compact: boolean) {
  const random = seededRandom(seed);
  const segments = compact ? 36 : 60;
  const levels = compact ? 6 : 9;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const surface = ["#4a6978", "#647c80", "#63766d", "#a4b4b7", "#a68c69", "#5c8874", "#465a75", "#99978c", "#69626b", "#718a91"][index];
  const dark = new THREE.Color(index === 7 ? "#3c4145" : "#111d2d");
  const light = new THREE.Color(surface);
  const square = [1, 3, 4, 6].includes(index);
  const stretch = index === 1 || index === 4 ? 1.2 : 1;
  const depthScale = index === 4 ? .49 : index === 1 ? .54 : .72;
  for (let ring = 0; ring <= levels; ring++) {
    const depth = ring / levels;
    const r = depth < .3 ? radius * (depth / .3) : radius * Math.pow(1 - (depth - .3) / .7, .55);
    const height = depth < .3 ? .2 - depth * .5 : -(depth - .3) * (index === 7 ? 8 : index === 6 ? 11 : 14);
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const exponent = square ? 5 : 2;
      let contour = 1 / Math.pow(Math.pow(Math.abs(Math.cos(angle)), exponent) + Math.pow(Math.abs(Math.sin(angle)), exponent), 1 / exponent);
      if (index === 8) contour = Math.cos(Math.PI / 6) / Math.cos((angle % (Math.PI / 3)) - Math.PI / 6);
      const rough = 1 + Math.sin(angle * (index === 5 ? 6 : 5) + seed) * (index === 5 ? .15 : .045) + Math.sin(angle * 11) * .025;
      const px = Math.cos(angle) * r * rough * contour * stretch;
      const pz = Math.sin(angle) * r * rough * contour * depthScale;
      const crater = index === 7 && depth < .34 ? Math.exp(-((px + 2.8) ** 2 + (pz - 1.8) ** 2) / 1.4) * .65 : 0;
      positions.push(px, height - crater + (random() - .5) * (depth < .3 ? index === 7 ? .35 : .12 : .6), pz);
      const color = dark.clone().lerp(light, depth < .33 ? .65 + random() * .3 : .07 + random() * .24);
      colors.push(color.r, color.g, color.b);
      if (ring < levels && i < segments) {
        const a = ring * (segments + 1) + i, b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function mountainsGeometry(compact: boolean) {
  const width = 380, depth = 70, nx = compact ? 80 : 180, nz = compact ? 12 : 28;
  const geometry = new THREE.PlaneGeometry(width, depth, nx, nz);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const color: number[] = [];
  const base = new THREE.Color("#193448");
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    const ridge = Math.pow(Math.abs(Math.sin(x * .053 + Math.sin(z * .12) * .8) * Math.cos(x * .13 + z * .06)), 1.3);
    const height = ridge * (5 + Math.abs(z) * .18) + Math.sin(x * .37 + z * .21) * 1.2;
    positions.setY(i, height);
    const c = base.clone().multiplyScalar(.5 + height * .055);
    color.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function Starfield({ compact }: { compact: boolean }) {
  const geometry = useMemo(() => {
    const random = seededRandom(824);
    const count = compact ? 850 : 2700;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      data.set([random() * 500 - 100, random() * 100 + 5, -40 - random() * 170], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data, 3));
    return geo;
  }, [compact]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <points geometry={geometry}><pointsMaterial color="#b2d0e3" size={.14} sizeAttenuation transparent opacity={.72} depthWrite={false} fog={false} /></points>;
}

function WorldTrail({ texture, compact }: { texture: THREE.Texture; compact: boolean }) {
  const { ribbon, dust } = useMemo(() => {
    const path = Array.from({ length: 220 }, (_, i) => {
      const progress = i / 219 * LAST_STOP;
      return new THREE.Vector3(progress * STOP_SPACING + 5, -1.3 + Math.sin(progress * 1.5) * .8, Math.sin(progress * 1.1) * 4 + 6 + Math.sin(progress * Math.PI * 2) * 3);
    });
    const curve = new THREE.CatmullRomCurve3(path);
    const geo = new THREE.TubeGeometry(curve, compact ? 180 : 450, .035, 4, false);
    const random = seededRandom(215);
    const count = compact ? 350 : 1100;
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const p = curve.getPoint(random());
      points.set([p.x, p.y + (random() - .5) * 2.5, p.z + (random() - .5) * 3], i * 3);
    }
    const cloud = new THREE.BufferGeometry();
    cloud.setAttribute("position", new THREE.BufferAttribute(points, 3));
    return { ribbon: geo, dust: cloud };
  }, [compact]);
  useEffect(() => () => { ribbon.dispose(); dust.dispose(); }, [ribbon, dust]);
  return <>
    <mesh geometry={ribbon}><meshBasicMaterial color="#bba778" transparent opacity={.45} /></mesh>
    <points geometry={dust}><pointsMaterial size={.25} color="#d5c298" map={texture} transparent opacity={.7} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
  </>;
}

function Pylon({ position, height, color }: { position: [number, number, number]; height: number; color: string }) {
  return <group position={position}>
    <mesh position={[0, height / 2, 0]}><boxGeometry args={[.22, height, .22]} /><meshStandardMaterial color="#283b4d" metalness={.45} roughness={.5} /></mesh>
    <mesh position={[0, height - .4, .13]}><boxGeometry args={[.055, .75, .03]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={[0, .1, 0]}><boxGeometry args={[.7, .2, .7]} /><meshStandardMaterial color="#354856" /></mesh>
  </group>;
}

function OrbitalGate({ color, texture, travel, compact }: { color: string; texture: THREE.Texture; travel: MutableRefObject<TravelState>; compact: boolean }) {
  const rings = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (rings.current && !travel.current.reduced && !travel.current.paused) rings.current.rotation.y += Math.min(delta, .05) * .08; });
  return <group position={[0, 3.1, 0]}>
    <group ref={rings}>
      <mesh rotation={[.15, .3, .17]}><torusGeometry args={[3.1, .085, compact ? 6 : 10, compact ? 60 : 110]} /><meshStandardMaterial color="#a79a77" metalness={.8} roughness={.34} /></mesh>
      <mesh rotation={[-.45, -.62, .4]}><torusGeometry args={[2.6, .035, 6, compact ? 60 : 100]} /><meshBasicMaterial color={color} /></mesh>
      <mesh rotation={[.85, .4, -.5]}><torusGeometry args={[2.1, .045, 6, compact ? 60 : 96]} /><meshStandardMaterial color="#8aabb4" metalness={.8} roughness={.3} /></mesh>
      <mesh><icosahedronGeometry args={[.83, 1]} /><meshStandardMaterial color="#3f778b" metalness={.5} roughness={.3} emissive="#76b8c1" emissiveIntensity={.65} /></mesh>
      <mesh><icosahedronGeometry args={[1.05, 1]} /><meshBasicMaterial color={color} wireframe transparent opacity={.33} /></mesh>
    </group>
    <sprite scale={[6, 6, 1]}><spriteMaterial map={texture} color={color} transparent opacity={.23} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    <mesh position={[0, -2.8, 0]}><cylinderGeometry args={[1.5, 2, .5, compact ? 24 : 48]} /><meshStandardMaterial color="#293d48" metalness={.3} /></mesh>
  </group>;
}

function Landmark({ index, color, texture, travel, compact }: { index: number; color: string; texture: THREE.Texture; travel: MutableRefObject<TravelState>; compact: boolean }) {
  if (index === 0) return <OrbitalGate color={color} texture={texture} travel={travel} compact={compact} />;
  return <ProjectLandmarks index={index} color={color} travel={travel} />;
}

function Island({ stop, texture, travel, compact }: { stop: number; texture: THREE.Texture; travel: MutableRefObject<TravelState>; compact: boolean }) {
  const index = landmarkIndexForStop(stop);
  const geometry = useMemo(() => islandGeometry(70 + index * 17, index === 0 ? 9 : 8.2, index, compact), [index, compact]);
  const rocks = useMemo(() => {
    const random = seededRandom(index * 19 + 57);
    const count = index === 3 || index === 6 || index === 8 ? 9 : 18;
    return Array.from({ length: compact ? Math.ceil(count / 2) : count }, () => {
      const angle = random() * Math.PI * 2, radius = 5.9 + random() * 1.4;
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius * .7, scale: .15 + random() * .6, rotation: random() * 6 };
    });
  }, [index, compact]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const color = palette[index];
  return <group position={stationPosition(stop)}>
    <mesh geometry={geometry}><meshStandardMaterial vertexColors roughness={.95} metalness={.08} side={THREE.DoubleSide} /></mesh>
    <Landmark index={index} color={color} texture={texture} travel={travel} compact={compact} />
    <WorldDetails index={index} color={color} travel={travel} compact={compact} />
    {rocks.map((rock, n) => <mesh key={n} position={[rock.x, rock.scale * .2, rock.z]} scale={[rock.scale, rock.scale * 1.3, rock.scale]} rotation={[.2, rock.rotation, .15]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={index === 7 ? "#8a8c83" : index === 4 ? "#8f765d" : index === 5 ? "#527564" : n % 4 ? "#304451" : "#788279"} roughness={1} /></mesh>)}
    {[-4.4, 4.4].map((x, n) => <Pylon key={n} position={[x, -.1, 3.5]} height={.7} color={color} />)}
    <mesh position={[0, -2.8, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[2.9, 16, compact ? 20 : 40, 1, true]} /><meshBasicMaterial color={color} transparent opacity={.018} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
  </group>;
}

function Atmosphere({ texture, compact }: { texture: THREE.Texture; compact: boolean }) {
  const mountains = useMemo(() => mountainsGeometry(compact), [compact]);
  const moon = useMemo(() => {
    const geometry = new THREE.SphereGeometry(7, compact ? 32 : 64, compact ? 24 : 48);
    const position = geometry.attributes.position;
    const colors: number[] = [];
    const random = seededRandom(383);
    const craters = Array.from({ length: 28 }, () => ({
      center: new THREE.Vector3(random() - .5, random() - .5, random() - .5).normalize(),
      radius: .035 + random() * .16,
    }));
    const point = new THREE.Vector3();
    const color = new THREE.Color("#a8b5bd");
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).normalize();
      let shade = .84 + Math.sin(point.x * 63 + Math.cos(point.z * 30)) * .035 + Math.cos(point.y * 83 + point.x * 19) * .045;
      let depression = 0;
      for (const crater of craters) {
        const distance = point.distanceTo(crater.center) / crater.radius;
        if (distance < 1) {
          depression += (1 - distance) * .015;
          shade -= (1 - distance) * .2;
        }
      }
      const c = color.clone().multiplyScalar(shade);
      colors.push(c.r, c.g, c.b);
      position.setXYZ(i, point.x * 7 * (1 - depression), point.y * 7 * (1 - depression), point.z * 7 * (1 - depression));
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, [compact]);
  useEffect(() => () => { mountains.dispose(); moon.dispose(); }, [mountains, moon]);
  return <>
    <color attach="background" args={["#081725"]} />
    <fogExp2 attach="fog" args={["#102737", .013]} />
    <hemisphereLight args={["#87b3d1", "#10202e", 2.1]} />
    <directionalLight position={[-15, 28, -9]} color="#96c2dd" intensity={3.2} />
    <directionalLight position={[3, 12, 16]} color="#c7b28b" intensity={1.15} />
    <Starfield compact={compact} />
    <mesh geometry={mountains} position={[125, -13, -35]}><meshStandardMaterial vertexColors flatShading roughness={1} /></mesh>
    <mesh geometry={mountains} position={[135, -17, -75]} scale={[1.2, 1.65, 1]}><meshStandardMaterial color="#28475d" flatShading roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[125, -13, 5]}><planeGeometry args={[700, 400]} /><meshStandardMaterial color="#193a48" roughness={.25} metalness={.55} transparent opacity={.75} /></mesh>
    <group position={[32, 15, -110]}>
      <mesh geometry={moon}><meshStandardMaterial vertexColors roughness={1} fog={false} /></mesh>
      <sprite scale={[34, 34, 1]}><spriteMaterial map={texture} color="#5b8aa4" transparent opacity={.15} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
    <sprite position={[140, 8, -120]} scale={[220, 80, 1]}><spriteMaterial map={texture} color="#2d6588" transparent opacity={.17} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} /></sprite>
  </>;
}

/** Distant chapters leave the React tree, releasing their meshes and sign textures. */
function NearbyIslands({ travel, texture, compact, started, onMountedChange }: {
  travel: MutableRefObject<TravelState>;
  texture: THREE.Texture;
  compact: boolean;
  started: boolean;
  onMountedChange: (stops: number[]) => void;
}) {
  const [center, setCenter] = useState(() => nearestStop(travel.current.current));
  const [neighbors, setNeighbors] = useState<number[]>([]);
  const { invalidate } = useThree();
  useFrame(() => {
    const current = nearestStop(travel.current.current);
    if (current !== center) setCenter(current);
  });
  useEffect(() => {
    if (!started) return;
    let canceled = false;
    let timer: number | undefined;
    let idle: number | undefined;
    const desired = islandWindow(center, LAST_STOP);
    const direction = travel.current.target >= center ? 1 : -1;
    const queue = desired.filter(stop => stop !== center).sort((a, b) => direction * (b - a));
    const mountNext = () => {
      if (canceled) return;
      const next = queue.shift();
      if (next === undefined) return;
      setNeighbors(previous => [...new Set([...previous.filter(stop => desired.includes(stop)), next])]);
      invalidate();
      if (queue.length) schedule();
    };
    const schedule = () => {
      // Leave one visible frame between texture/geometry uploads on slower phones.
      timer = window.setTimeout(() => {
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(mountNext, { timeout: 350 });
        else mountNext();
      }, compact ? 160 : 70);
    };
    schedule();
    return () => {
      canceled = true;
      window.clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, [center, compact, invalidate, started, travel]);
  const stops = useMemo(() => {
    const desired = islandWindow(center, LAST_STOP);
    return [center, ...neighbors.filter(stop => stop !== center && desired.includes(stop))].sort((a, b) => a - b);
  }, [center, neighbors]);
  useEffect(() => { onMountedChange(stops); }, [onMountedChange, stops]);
  return stops.map(stop => <Island key={stop} stop={stop} texture={texture} travel={travel} compact={compact} />);
}

type DirectorProps = WorldProps & {
  quality: RenderQuality;
  onMountedChange: (stops: number[]) => void;
  onSlowDevice: () => void;
};

function Director({ travel, markerElements, onProgress, onReady, onUnavailable, quality, onMountedChange, onSlowDevice }: DirectorProps) {
  const { camera, size, gl, invalidate } = useThree();
  const compact = quality === "compact";
  const [started, setStarted] = useState(false);
  const texture = useMemo(() => createGlow(), []);
  const light = useRef<THREE.PointLight>(null);
  const look = useMemo(() => new THREE.Vector3(), []);
  const projection = useMemo(() => new THREE.Vector3(), []);
  const clock = useRef(0);
  const announced = useRef(false);
  const rendered = useRef(false);
  const performanceSample = useRef({ elapsed: 0, frames: 0, done: false });
  useEffect(() => addAfterEffect(() => {
    // useFrame runs before gl.render; only announce readiness after an actual draw.
    if (!announced.current && rendered.current && gl.info.render.frame > 0 && !gl.getContext().isContextLost()) {
      announced.current = true;
      setStarted(true);
      onReady();
    }
  }), [gl, onReady]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onUnavailable(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => { canvas.removeEventListener("webglcontextlost", lost); texture.dispose(); };
  }, [gl, onUnavailable, texture]);
  useEffect(() => {
    let frame = 0;
    let lastFrame = 0;
    const wake = (now: number) => {
      const motion = travel.current;
      if (!document.hidden && !motion.paused && (!motion.reduced || motion.current !== motion.target) && (!compact || now - lastFrame >= 32)) {
        invalidate();
        lastFrame = now;
      }
      frame = requestAnimationFrame(wake);
    };
    frame = requestAnimationFrame(wake);
    const visible = () => { if (!document.hidden) invalidate(); };
    document.addEventListener("visibilitychange", visible);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", visible); };
  }, [compact, invalidate, travel]);
  useFrame((_, delta) => {
    rendered.current = true;
    const motion = travel.current;
    const progress = advanceTravel(motion, delta);
    const x = progress * STOP_SPACING;
    const y = Math.sin(progress * 1.5) * .8;
    const z = Math.sin(progress * 1.1) * 4;
    const narrow = size.width < 700;
    const parallax = motion.reduced || motion.paused ? 0 : 1;
    const arc = Math.sin(progress * Math.PI) ** 2;
    camera.position.set(x - 7 + motion.pointerX * .5 * parallax, y + (narrow ? 14 : 10) + arc * 2 + motion.pointerY * .35 * parallax, z + (narrow ? 41 : 26) + arc * 3);
    look.set(x + (narrow ? 3 : 0), y + (narrow ? 7 : 1.1) + arc, z - 2);
    camera.lookAt(look);
    if (light.current) { light.current.position.set(x + 3, y + 5, z + 4); light.current.color.set(palette[landmarkIndexForStop(nearestStop(progress))]); }
    camera.updateMatrixWorld();
    markerElements.current.forEach((element, index) => {
      if (!element) return;
      const pos = stationPosition(index);
      projection.set(pos[0], pos[1] + (narrow ? 3.9 : 7.1), pos[2]);
      projection.project(camera);
      const distance = Math.abs(progress - index);
      const visible = distance < .62 && projection.z < 1 && !motion.paused;
      element.style.visibility = visible ? "visible" : "hidden";
      element.style.opacity = String(Math.max(0, 1 - distance / .62));
      element.style.transform = "translate3d(" + ((projection.x * .5 + .5) * size.width).toFixed(1) + "px," + ((-projection.y * .5 + .5) * size.height).toFixed(1) + "px,0) translate(-50%,-100%)";
      element.tabIndex = visible ? 0 : -1;
    });
    clock.current += delta;
    if (clock.current > .07 || motion.reduced) {
      onProgress(progress);
      clock.current = 0;
    }
    // Fall back to the lighter geometry budget after sustained slow frames, once.
    const sample = performanceSample.current;
    if (!compact && started && !sample.done && !motion.paused && !motion.reduced && delta > 0 && delta < .15) {
      sample.elapsed += delta;
      sample.frames++;
      if (sample.elapsed > 4 && sample.frames >= 45) {
        sample.done = true;
        if (sample.elapsed / sample.frames > .034) onSlowDevice();
      }
    }
  });
  return <>
    <Atmosphere texture={texture} compact={compact} />
    <pointLight ref={light} color="#8edce1" intensity={70} distance={25} decay={2} />
    <WorldTrail texture={texture} compact={compact} />
    <NearbyIslands travel={travel} texture={texture} compact={compact} started={started} onMountedChange={onMountedChange} />
  </>;
}

class WorldBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("The 3D scene stopped:", error); this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function CinematicWorld(props: WorldProps) {
  const [visible, setVisible] = useState(true);
  const [quality, setQuality] = useState<RenderQuality>(initialRenderQuality);
  const [mountedStops, setMountedStops] = useState<number[]>([]);
  const compact = quality === "compact";
  const slowDevice = useCallback(() => setQuality("compact"), []);
  const mounted = useCallback((stops: number[]) => setMountedStops(stops), []);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return <div data-render-quality={quality} data-mounted-islands={mountedStops.length} data-island-stops={mountedStops.join(",")} style={{ position: "absolute", inset: 0 }}>
    <WorldBoundary onUnavailable={props.onUnavailable}>
    <Canvas frameloop={visible ? "demand" : "never"} dpr={compact ? 1 : [1, 1.5]} camera={{ position: [-7, 10, 26], fov: 43, near: .2, far: compact ? 300 : 420 }}
      gl={{ antialias: !compact, alpha: false, powerPreference: compact ? "default" : "high-performance", stencil: false }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.25; }}
      fallback="This browser could not display the 3D world. Open the atlas to explore.">
      <Director {...props} quality={quality} onMountedChange={mounted} onSlowDevice={slowDevice} />
    </Canvas>
    </WorldBoundary>
  </div>;
}
