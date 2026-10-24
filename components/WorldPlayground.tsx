"use client";

import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { curiosities, type Curiosity, type WorldActivity } from "@/lib/curiosities";
import { seededRandom, type TravelState } from "@/lib/world";

type Props = { stop: number; color: string; activity: MutableRefObject<WorldActivity>; travel: MutableRefObject<TravelState>; texture: THREE.Texture; compact: boolean };

function CuriosityModel({ item, color, activity, travel, texture }: Omit<Props, "stop" | "compact"> & { item: Curiosity }) {
  const moving = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const aura = useRef<THREE.Sprite>(null);
  const burst = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const data = new Float32Array(36 * 3);
    const random = seededRandom(item.stop * 27 + item.id.charCodeAt(2));
    for (let i = 0; i < 36; i++) {
      const angle = i * 2.399;
      const radius = .8 + random() * 1.5;
      data.set([Math.cos(angle) * radius, random() * 2.8, Math.sin(angle) * radius], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data, 3));
    return geo;
  }, [item.id, item.stop]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }, delta) => {
    if (travel.current.paused) return;
    const age = (performance.now() - activity.current.started) / 1000;
    const active = activity.current.id === item.id && age < 6;
    const pulse = active ? Math.exp(-age * .32) : 0;
    const t = travel.current.reduced ? 0 : clock.elapsedTime;
    if (moving.current) {
      moving.current.rotation.y += travel.current.reduced ? 0 : Math.min(delta, .05) * (.18 + pulse * 2.5);
      moving.current.position.y = (item.kind === "lantern" ? .65 + (active && !travel.current.reduced ? age * .85 : 0) : item.kind === "drone" ? .95 + (active ? Math.sin(age * 1.8) * .6 + .6 : 0) : .65) + Math.sin(t * 1.25 + item.stop) * .08;
      if (item.kind === "drone") moving.current.position.x = active && !travel.current.reduced ? Math.sin(age * 2) * 1.8 * Math.min(1, age) : 0;
    }
    if (halo.current) {
      halo.current.rotation.z = t * .3;
      halo.current.scale.setScalar(1 + pulse * .6 + Math.sin(t * 2) * .04);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = .28 + pulse * .6;
    }
    if (core.current) core.current.scale.setScalar(1 + pulse * .25);
    if (aura.current) (aura.current.material as THREE.SpriteMaterial).opacity = .13 + pulse * .4;
    if (burst.current) {
      burst.current.rotation.y = t * .15;
      burst.current.position.y = active && !travel.current.reduced ? age * .35 : 0;
      burst.current.scale.setScalar(.8 + pulse * 1.6);
      (burst.current.material as THREE.PointsMaterial).opacity = active ? pulse * .9 : .14;
    }
  });
  const metallic = <meshStandardMaterial color="#809a9d" roughness={.38} metalness={.65} />;
  return <group position={item.at}>
    <mesh position={[0, .07, 0]}><cylinderGeometry args={[.65, .8, .2, 12]} /><meshStandardMaterial color="#354a59" roughness={.5} metalness={.45} /></mesh>
    <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, .19, 0]}><ringGeometry args={[.77, .8, 32]} /><meshBasicMaterial color={color} transparent opacity={.4} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    <group ref={moving} position={[0, .65, 0]}>
      {(item.kind === "reactor" || item.kind === "garden") && <>
        <mesh ref={core} position={[0, .4, 0]}><octahedronGeometry args={[.4]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.9} roughness={.2} metalness={.5} /></mesh>
        {[0, 1, 2].map(n => <mesh key={n} rotation={[.3 + n * .8, n, .3]} position={[0, .4, 0]}><torusGeometry args={[.65 + n * .08, .018, 5, 32]} /><meshBasicMaterial color={n % 2 ? "#e3c491" : color} transparent opacity={.6} /></mesh>)}
      </>}
      {item.kind === "telescope" && <>
        <mesh position={[0, -.1, 0]}>{metallic}<cylinderGeometry args={[.07, .07, .9, 8]} /></mesh>
        <group rotation={[.35, -.3, Math.PI / 3]} position={[0, .4, 0]}>
          <mesh><cylinderGeometry args={[.25, .19, 1.2, 12]} />{metallic}</mesh>
          <mesh position={[0, .62, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.22, 16]} /><meshBasicMaterial color={color} /></mesh>
          <mesh position={[0, -.63, 0]}><cylinderGeometry args={[.08, .08, .2, 8]} /><meshStandardMaterial color="#d7bd87" metalness={.7} roughness={.3} /></mesh>
        </group>
      </>}
      {item.kind === "lantern" && <>
        <mesh position={[0, .4, 0]}><boxGeometry args={[.52, .72, .52]} /><meshStandardMaterial color="#edd7a4" emissive="#ffcb7c" emissiveIntensity={1.6} transparent opacity={.8} /></mesh>
        {[-.3, .3].flatMap(x => [-.3, .3].map(z => <mesh key={`${x}-${z}`} position={[x, .4, z]}><boxGeometry args={[.035, .85, .035]} />{metallic}</mesh>))}
        <mesh position={[0, -.08, 0]}><cylinderGeometry args={[.36, .3, .12, 8]} />{metallic}</mesh>
      </>}
      {item.kind === "drone" && <>
        <mesh scale={[1, .25, 1]}><sphereGeometry args={[.65, 16, 8]} />{metallic}</mesh>
        <mesh position={[0, .15, 0]}><sphereGeometry args={[.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#8fe6d5" emissive="#4d9c9b" emissiveIntensity={.7} metalness={.4} roughness={.15} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.57, .035, 5, 24]} /><meshBasicMaterial color={color} /></mesh>
      </>}
      {item.kind === "gate" && <>
        <mesh position={[0, .35, 0]}><torusGeometry args={[.63, .09, 8, 36]} />{metallic}</mesh>
        <mesh position={[0, .35, .02]}><torusGeometry args={[.52, .035, 5, 36]} /><meshBasicMaterial color={color} /></mesh>
        <mesh position={[0, .35, 0]}><circleGeometry args={[.49, 32]} /><meshBasicMaterial color={color} transparent opacity={.13} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      </>}
      {(item.kind === "satellite" || item.kind === "scanner") && <>
        <mesh position={[0, -.05, 0]}><cylinderGeometry args={[.08, .16, .8, 8]} />{metallic}</mesh>
        <group rotation={[-.6, .3, 0]} position={[0, .4, 0]}>
          <mesh><sphereGeometry args={[.65, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#b3c7c7" metalness={.65} roughness={.35} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, .6, 0]}><sphereGeometry args={[.09, 8, 6]} /><meshBasicMaterial color={color} /></mesh>
          <mesh position={[0, .3, 0]}><cylinderGeometry args={[.025, .025, .6, 6]} />{metallic}</mesh>
        </group>
      </>}
    </group>
    <sprite ref={aura} position={[0, .85, 0]} scale={[3.8, 3.8, 1]}><spriteMaterial map={texture} color={color} transparent opacity={.18} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    <points ref={burst} geometry={geometry} position={[0, .4, 0]}><pointsMaterial map={texture} color={color} size={.16} transparent opacity={.15} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
  </group>;
}

export default function WorldPlayground(props: Props) {
  return <group>{curiosities.filter(item => item.stop === props.stop).map(item => <CuriosityModel key={item.id} {...props} item={item} />)}</group>;
}

export function IslandMagic({ index, texture, color, travel, compact }: { index: number; texture: THREE.Texture; color: string; travel: Props["travel"]; compact: boolean }) {
  const motes = useRef<THREE.Points>(null);
  const waterfall = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const random = seededRandom(index * 51 + 146);
    const count = compact ? 35 : 80;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2, radius = 2 + random() * 5;
      data.set([Math.cos(angle) * radius, .5 + random() * 4.2, Math.sin(angle) * radius * .65], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(data, 3)); return geo;
  }, [index, compact]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    if (travel.current.paused || travel.current.reduced) return;
    if (motes.current) { motes.current.rotation.y = clock.elapsedTime * .035; motes.current.position.y = Math.sin(clock.elapsedTime * .5) * .15; }
    if (waterfall.current) waterfall.current.children.forEach((child, n) => { child.position.y = -((clock.elapsedTime * (1.2 + n * .2) + n * .8) % 5) - .3; });
  });
  return <>
    <points ref={motes} geometry={geometry}><pointsMaterial map={texture} color={index === 0 || index === 5 ? "#a6ffd9" : color} size={.13} transparent opacity={.65} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
    <sprite position={[0, -4, 0]} scale={[12, 8, 1]}><spriteMaterial map={texture} color={color} transparent opacity={.12} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    {[0, 5, 9].includes(index) && <group position={[-5.9, .05, .2]}>
      <mesh position={[0, -2.6, 0]}><cylinderGeometry args={[.14, .3, 5.6, 7, 1, true]} /><meshBasicMaterial color="#a6dfec" transparent opacity={.26} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <group ref={waterfall}>{[0, 1, 2, 3, 4].map(n => <mesh key={n} position={[Math.sin(n * 4) * .16, -n, Math.cos(n * 4) * .13]}><cylinderGeometry args={[.035, .08, 1.3, 5]} /><meshBasicMaterial color="#c1f4ee" transparent opacity={.4} depthWrite={false} /></mesh>)}</group>
      <sprite position={[0, -5.6, 0]} scale={[3, 1.8, 1]}><spriteMaterial map={texture} color="#92d4e2" transparent opacity={.25} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>}
  </>;
}

export function CelestialGarden({ texture, travel, compact }: { texture: THREE.Texture; travel: Props["travel"]; compact: boolean }) {
  const aurora = useRef<THREE.Group>(null);
  const ribbons = useMemo(() => [0, 1, 2].map(band => {
    const positions: number[] = [], colors: number[] = [], indices: number[] = [];
    const tint = new THREE.Color(["#58bfae", "#628bc7", "#ba86c9"][band]);
    const segments = 96, rows = 5;
    for (let n = 0; n <= segments; n++) {
      const x = n / segments * 440 - 75;
      const y = 27 + band * 5 + Math.sin(n * .105 + band * 1.7) * 9;
      for (let row = 0; row < rows; row++) {
        const v = row / (rows - 1);
        positions.push(x, y + v * (10 + Math.sin(n * .22) * 4), -125 - band * 15 + v * 2);
        const fade = Math.sin(n / segments * Math.PI) * Math.sin(v * Math.PI) ** 2;
        colors.push(tint.r * fade, tint.g * fade, tint.b * fade);
        if (n < segments && row < rows - 1) {
          const a = n * rows + row;
          indices.push(a, a + 1, a + rows, a + 1, a + rows + 1, a + rows);
        }
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3)); geometry.setIndex(indices); return geometry;
  }), []);
  useEffect(() => () => ribbons.forEach(geometry => geometry.dispose()), [ribbons]);
  useFrame(({ clock }) => { if (aurora.current && !travel.current.paused && !travel.current.reduced) aurora.current.position.y = Math.sin(clock.elapsedTime * .12) * 2; });
  return <>
    <group ref={aurora}>{ribbons.map((geometry, n) => <mesh key={n} geometry={geometry}><meshBasicMaterial vertexColors transparent opacity={.19} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>)}</group>
    <group position={[180, 40, -185]} rotation={[.35, -.25, .35]}>
      <mesh><sphereGeometry args={[10, compact ? 24 : 40, compact ? 16 : 24]} /><meshStandardMaterial color="#759599" roughness={1} fog={false} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[13, 19, compact ? 64 : 100]} /><meshBasicMaterial color="#c3b48d" transparent opacity={.35} side={THREE.DoubleSide} depthWrite={false} fog={false} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[20, 20.5, 80]} /><meshBasicMaterial color="#8babae" transparent opacity={.25} side={THREE.DoubleSide} depthWrite={false} fog={false} /></mesh>
      <sprite scale={[48, 48, 1]}><spriteMaterial map={texture} color="#78aaa3" opacity={.12} transparent depthWrite={false} fog={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
  </>;
}
