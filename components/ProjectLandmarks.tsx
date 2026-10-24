"use client";

import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type TravelState } from "@/lib/world";

type V3 = [number, number, number];
type LandmarkProps = { index: number; color: string; travel: MutableRefObject<TravelState> };

function Block({ at, size, color = "#365267", glow = false, rotation = [0, 0, 0] }: { at: V3; size: V3; color?: string; glow?: boolean; rotation?: V3 }) {
  return <mesh position={at} rotation={rotation}><boxGeometry args={size} />{glow ? <meshBasicMaterial color={color} /> : <meshStandardMaterial color={color} metalness={.35} roughness={.58} />}</mesh>;
}

function Line({ points, color, thickness = .035 }: { points: number[][]; color: string; thickness?: number }) {
  const signature = JSON.stringify(points);
  const geometry = useMemo(() => {
    const data = JSON.parse(signature) as number[][];
    const curve = new THREE.CatmullRomCurve3(data.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    return new THREE.TubeGeometry(curve, 40, thickness, 5, false);
  }, [signature, thickness]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshBasicMaterial color={color} /></mesh>;
}

function Sign({ label, color, at, width = 4.4, height = 2.1, kind = "code", rotation = [0, 0, 0] }: { label: string; color: string; at: V3; width?: number; height?: number; kind?: string; rotation?: V3 }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2 / 3, 2 / 3);
    ctx.fillStyle = "#08151f";
    ctx.fillRect(0, 0, 768, 384);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 752, 368);
    ctx.fillStyle = color;
    ctx.font = "600 40px sans-serif";
    ctx.fillText(label, 34, 61);
    ctx.globalAlpha = .25;
    ctx.fillRect(34, 86, 700, 2);
    ctx.globalAlpha = 1;
    if (kind === "xray") {
      ctx.strokeStyle = "#9ed5e2";
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(384, 119); ctx.lineTo(384, 344); ctx.stroke();
      for (let rib = 0; rib < 6; rib++) {
        const y = 146 + rib * 29;
        ctx.beginPath(); ctx.ellipse(324, y, 64 + rib * 3, 22, .18, 0, Math.PI * 1.6); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(444, y, 64 + rib * 3, 22, -.18, Math.PI * -.6, Math.PI); ctx.stroke();
      }
      ctx.fillStyle = "#db9e7055"; ctx.beginPath(); ctx.ellipse(433, 247, 55, 39, -.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.font = "20px sans-serif"; ctx.fillText("GRAD-CAM / RESEARCH", 35, 350);
    } else if (kind === "fuel") {
      ["NOZZLE", "VEHICLE", "POSE", "FIRE"].forEach((text, n) => {
        const x = 36 + n * 182;
        ctx.strokeStyle = n === 3 ? "#e4b18b" : "#97d8ca";
        ctx.strokeRect(x, 133, 150, 116);
        ctx.fillStyle = "#c4dcd9"; ctx.font = "21px sans-serif"; ctx.fillText(text, x + 14, 176);
        ctx.fillStyle = n === 3 ? "#e4b18b" : "#97d8ca"; ctx.font = "24px sans-serif"; ctx.fillText("VISION", x + 14, 222);
      });
      ctx.fillStyle = color; ctx.font = "24px sans-serif"; ctx.fillText("DETECT   /   VALIDATE   /   ALERT", 119, 330);
    } else if (kind === "segments") {
      const hues = ["#d5aa78", "#81c8c4", "#b5a3d6", "#a5c78d", "#dc998c", "#8baed8"];
      hues.forEach((hue, n) => {
        const x = 110 + n % 3 * 250, y = 164 + Math.floor(n / 3) * 132;
        ctx.fillStyle = hue;
        for (let dot = 0; dot < 18; dot++) {
          const angle = dot * 2.4 + n, radius = 8 + dot * 2;
          ctx.beginPath(); ctx.arc(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * .65, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.font = "23px sans-serif"; ctx.fillText("0" + (n + 1), x + 58, y + 6);
      });
    } else if (kind === "lunar") {
      ctx.strokeStyle = "#7e99a534"; ctx.lineWidth = 1;
      for (let line = 0; line < 10; line++) {
        ctx.beginPath(); ctx.moveTo(32 + line * 76, 108); ctx.lineTo(32 + line * 76, 352); ctx.stroke();
      }
      for (let n = 0; n < 5; n++) {
        const x = 125 + n * 135, y = 186 + Math.sin(n * 3) * 48;
        ctx.strokeStyle = n % 2 ? "#d8d7bd" : "#7fabc2"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, 22 + n * 5, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = color; ctx.font = "23px sans-serif"; ctx.fillText("LOW LIGHT   →   VISIBLE DETAIL", 160, 343);
    } else if (kind === "signal") {
      ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.beginPath();
      for (let x = 35; x < 735; x++) {
        const y = 215 + Math.sin(x * .045) * Math.exp(-Math.pow((x - 384) / 180, 2)) * 75;
        if (x === 35) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.font = "24px sans-serif"; ctx.fillStyle = "#adc9d3"; ctx.fillText("CHENNAI  /  EARTH  /  SAY HELLO", 138, 341);
    } else if (kind === "chart") {
      ctx.strokeStyle = "#8bb6c12a"; ctx.lineWidth = 1;
      for (let n = 0; n < 5; n++) { ctx.beginPath(); ctx.moveTo(36, 128 + n * 47); ctx.lineTo(734, 128 + n * 47); ctx.stroke(); }
      const points = [[40, 303], [125, 270], [196, 290], [278, 223], [352, 249], [438, 169], [533, 197], [630, 130], [730, 151]];
      ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.beginPath();
      points.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
      ctx.fillStyle = "#c5d9df"; ctx.font = "22px sans-serif"; ctx.fillText("2020          HISTORICAL DATA          2024", 40, 355);
    } else if (kind === "pipeline") {
      ["LEAD", "SCORE", "OUTREACH", "INSIGHT"].forEach((text, n) => {
        const x = 35 + n * 184;
        ctx.fillStyle = color + "22"; ctx.fillRect(x, 158, 146, 94);
        ctx.strokeStyle = color; ctx.strokeRect(x, 158, 146, 94);
        ctx.fillStyle = "#d6e8e9"; ctx.font = "18px sans-serif"; ctx.fillText(text, x + 16, 214);
        if (n < 3) { ctx.beginPath(); ctx.moveTo(x + 146, 205); ctx.lineTo(x + 182, 205); ctx.stroke(); }
      });
      ctx.fillStyle = "#a8c5d0"; ctx.font = "24px sans-serif"; ctx.fillText("SIGNAL  →  DECISION  →  ACTION", 143, 324);
    } else {
      const lines = kind === "arsenal" ? ["Python    Java    JavaScript", "Pandas    SQL    Scikit-learn", "Power BI    Tableau    Git", "Linux    Jupyter    VS Code"] : ["identify(passenger)", "validate(wallet.balance)", "transaction.commit()", "journey.continue()"];
      lines.forEach((text, n) => { ctx.fillStyle = n % 2 ? "#aac6d6" : color; ctx.font = "29px monospace"; ctx.fillText(text, 39, 151 + n * 56); });
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 2;
    return map;
  }, [label, color, kind]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group position={at} rotation={rotation}>
    <Block at={[0, 0, -.1]} size={[width + .12, height + .12, .17]} color="#273f50" />
    <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
  </group>;
}

function Vehicle({ bus = false, color = "#6198aa" }: { bus?: boolean; color?: string }) {
  const length = bus ? 3.7 : 2.7;
  return <group>
    <Block at={[0, .62, 0]} size={[length, .8, 1.25]} color={color} />
    <Block at={[.05, 1.22, 0]} size={[length - .5, .65, 1.14]} color={bus ? color : "#49697d"} />
    {(bus ? [-1.1, -.45, .2, .85, 1.4] : [-.55, .25, .85]).map((x, n) => <Block key={n} at={[x, 1.25, .585]} size={[.49, .42, .025]} color="#122c40" />)}
    {[-length * .32, length * .32].flatMap(x => [-.62, .62].map(z => <mesh key={x + ":" + z} position={[x, .36, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.31, .31, .15, 16]} /><meshStandardMaterial color="#101923" roughness={1} /></mesh>))}
    <Block at={[length / 2 + .015, .66, .37]} size={[.025, .15, .24]} color="#f1dab2" glow />
    <Block at={[length / 2 + .015, .66, -.37]} size={[.025, .15, .24]} color="#f1dab2" glow />
  </group>;
}

function TransitIsland({ color, travel }: LandmarkProps) {
  const bus = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (travel.current.paused || travel.current.reduced) return;
    if (bus.current) bus.current.position.x = 1.6 + Math.sin(clock.elapsedTime * .3) * .65;
    if (scan.current) scan.current.position.y = 1.5 + Math.sin(clock.elapsedTime * 1.5) * .7;
  });
  return <group>
    <Block at={[0, .15, 1.8]} size={[12, .2, 3.2]} color="#1a2b38" />
    {[-4, -2, 0, 2, 4].map(x => <Block key={x} at={[x, .262, 1.8]} size={[.9, .015, .055]} color="#d2c7a0" glow />)}
    <group ref={bus} position={[1.6, .25, 1.7]}><Vehicle bus color="#447e91" /></group>
    <group position={[-2.7, .15, -1.1]}>
      <Block at={[0, 1.55, 0]} size={[3.3, .18, 1.5]} color="#5d8d9a" />
      {[-1.4, 1.4].map(x => <Block key={x} at={[x, .8, -.5]} size={[.12, 1.5, .12]} color="#9cafb5" />)}
      <Block at={[0, .52, -.45]} size={[2.5, .16, .4]} color="#a18e69" />
    </group>
    <group position={[1, .3, -1.7]}>
      {[-1.25, 1.25].map(x => <Block key={x} at={[x, 1.4, 0]} size={[.2, 2.8, .35]} color="#597887" />)}
      <Block at={[0, 2.8, 0]} size={[2.7, .22, .4]} color={color} glow />
      <mesh ref={scan} position={[0, 1.5, .12]}><planeGeometry args={[2.2, .09]} /><meshBasicMaterial color={color} transparent opacity={.8} side={THREE.DoubleSide} /></mesh>
    </group>
    <Sign label="FACEFARE / TRANSIT" color={color} at={[.5, 4.5, -2.1]} width={5.4} height={1.9} />
  </group>;
}

function SalesIsland({ color, travel }: LandmarkProps) {
  const signal = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!travel.current.paused && !travel.current.reduced && signal.current) signal.current.position.x = Math.sin(clock.elapsedTime * .8) * 3.9;
  });
  return <group>
    <Block at={[0, .2, 0]} size={[10, .45, 6]} color="#283a43" />
    <Sign label="SALESPILOT / AUTOMATION" color={color} at={[0, 4, -1.6]} width={6.5} height={2.8} kind="pipeline" />
    {[-3.8, 0, 3.8].map((x, i) => <group key={x} position={[x, .45, 1.1]}>
      <mesh position={[0, .9 + i * .22, 0]}><cylinderGeometry args={[.65, .85, 1.8 + i * .44, 6]} /><meshStandardMaterial color={["#8a7552", "#537685", "#789a8c"][i]} metalness={.6} roughness={.4} /></mesh>
      <mesh position={[0, 1.85 + i * .44, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.49, .59, 32]} /><meshBasicMaterial color={color} /></mesh>
    </group>)}
    <Line color={color} points={[[-4, 1, 2], [-2, 1.3, 2.5], [0, 1.1, 2.5], [2, 1.6, 2.5], [4, 1.8, 2]]} />
    <mesh ref={signal} position={[0, 1.3, 2.5]}><sphereGeometry args={[.16, 12, 8]} /><meshBasicMaterial color="#fff0c9" /></mesh>
    {[0, 1, 2, 3].map(n => <Block key={n} at={[-4.4, .5 + n * .28, -1.1]} size={[.7, .12, 1.4]} color="#546a78" />)}
  </group>;
}

function MedicalIsland({ color, travel }: LandmarkProps) {
  const scan = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!travel.current.paused && !travel.current.reduced && scan.current) scan.current.position.y = 3 + Math.sin(clock.elapsedTime * .8) * 1.15;
  });
  return <group>
    <Block at={[0, .2, 0]} size={[9.7, .4, 6.6]} color="#7f959c" />
    <Block at={[0, .55, -2.2]} size={[8.2, .7, 2.2]} color="#c0c8c3" />
    <Sign label="CHESTXPERT / X-RAY LAB" color={color} at={[0, 3.3, -1.2]} width={4.3} height={3.7} kind="xray" />
    <mesh ref={scan} position={[0, 3, -1.07]}><planeGeometry args={[4.1, .035]} /><meshBasicMaterial color="#ccf5ed" /></mesh>
    <group position={[-3.5, 2.9, -1]}>
      <Block at={[0, 0, 0]} size={[1.4, .4, .25]} color="#a6e2d6" glow />
      <Block at={[0, 0, 0]} size={[.4, 1.4, .25]} color="#a6e2d6" glow />
    </group>
    <group position={[2.9, .45, 1.2]}>
      <Block at={[0, .65, 0]} size={[1.45, .15, 3.1]} color="#c9d4d2" />
      <Block at={[0, .8, -1]} size={[1.15, .16, .5]} color="#78aeb8" />
      {[-.5, .5].map(x => <Block key={x} at={[x, .3, 0]} size={[.12, .6, 2.4]} color="#4c6675" />)}
    </group>
    <Block at={[-2.3, 1.15, 1.3]} size={[1.2, 1.5, 1.1]} color="#708d9e" />
    <Sign label="AI / INFERENCE" color="#a8d8e4" at={[-2.3, 1.8, 1.88]} width={1.05} height={.65} />
  </group>;
}

function FuelIsland({ color, travel }: LandmarkProps) {
  const beacon = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!travel.current.paused && !travel.current.reduced && beacon.current) beacon.current.rotation.y += delta * .5;
  });
  return <group>
    <Block at={[0, .16, 1]} size={[12, .25, 5.5]} color="#283a43" />
    {[-4.5, 4.5].flatMap(x => [-1.3, 1.3].map(z => <Block key={x + ":" + z} at={[x, 1.8, z - .7]} size={[.16, 3.2, .16]} color="#9c9f94" />))}
    <Block at={[0, 3.5, -.7]} size={[10, .35, 4]} color="#b8b6a2" />
    <Block at={[0, 3.72, 1.33]} size={[10, .14, .04]} color={color} glow />
    <Sign label="VISION / FUEL SAFETY" color={color} at={[0, 4.5, -.8]} width={5.4} height={1.15} kind="fuel" />
    {[-2.9, 2.9].map(x => <group key={x} position={[x, .35, -.3]}>
      <Block at={[0, .9, 0]} size={[.8, 1.8, .65]} color="#9aadb2" />
      <Block at={[0, 1.3, .34]} size={[.57, .42, .04]} color="#88e6d6" glow />
      <Line color="#17252d" thickness={.06} points={[[.4, 1.5, .1], [.9, 1.2, .3], [.9, .4, .2], [.52, .7, .35]]} />
    </group>)}
    <group position={[0, .3, 2.3]}><Vehicle color="#8d6c51" /></group>
    <group ref={beacon} position={[3.3, 4.1, -.8]}>
      <mesh><sphereGeometry args={[.18, 12, 10]} /><meshBasicMaterial color="#ffc39b" /></mesh>
      <Block at={[.5, 0, 0]} size={[1, .04, .07]} color="#ffb77f" glow />
    </group>
    <Block at={[-4.5, 4.1, -.7]} size={[.45, .35, .55]} color="#234254" />
  </group>;
}

function CustomerIsland({ color, travel }: LandmarkProps) {
  const pulse = useRef<THREE.Group>(null);
  const colors = ["#d5aa78", "#81c8c4", "#b5a3d6", "#a5c78d", "#dc998c", "#8baed8"];
  useFrame(({ clock }) => {
    if (!travel.current.paused && !travel.current.reduced && pulse.current) pulse.current.rotation.y = Math.sin(clock.elapsedTime * .2) * .12;
  });
  return <group>
    <group ref={pulse}>{colors.map((c, n) => {
      const angle = n / 6 * Math.PI * 2, x = Math.cos(angle) * 3.4, z = Math.sin(angle) * 2.7;
      return <group key={c}>
        <Line color={c} thickness={.025} points={[[0, 1.5, 0], [x * .5, 2.15, z * .5], [x, 1.2, z]]} />
        <mesh position={[x, .25, z]}><cylinderGeometry args={[1.05, 1.2, .35, 8]} /><meshStandardMaterial color="#466258" roughness={.85} /></mesh>
        {[0, 1, 2].map(person => <group key={person} position={[x + (person - 1) * .4, .4, z]}>
          <mesh position={[0, .42, 0]}><capsuleGeometry args={[.12, .35, 3, 7]} /><meshStandardMaterial color={c} /></mesh>
          <mesh position={[0, .86, 0]}><sphereGeometry args={[.16, 10, 8]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={.15} /></mesh>
        </group>)}
      </group>;
    })}</group>
    <mesh position={[0, 1.55, 0]}><icosahedronGeometry args={[.72, 1]} /><meshStandardMaterial color={color} metalness={.6} roughness={.3} emissive={color} emissiveIntensity={.3} /></mesh>
    <Sign label="6 CUSTOMER SEGMENTS" color={color} at={[0, 4.3, -2]} width={5.4} height={1.5} kind="segments" />
  </group>;
}

function MarketIsland({ color, travel }: LandmarkProps) {
  const candle = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!travel.current.paused && !travel.current.reduced && candle.current) candle.current.scale.y = 1 + Math.sin(clock.elapsedTime * .6) * .07;
  });
  return <group>
    <Block at={[0, .2, 0]} size={[10.5, .45, 6]} color="#233342" />
    <Sign label="AAPL / MARKET HISTORY" color={color} at={[0, 4, -1.8]} width={6.8} height={3} kind="chart" />
    <group ref={candle}>{[1, 1.7, 1.4, 2.2, 3, 2.6, 3.7].map((height, n) => <group key={n} position={[(n - 3) * .9, .5, .8]}>
      <Block at={[0, height / 2, 0]} size={[.43, height, .55]} color={n === 2 || n === 5 ? "#b97875" : "#67b3a8"} />
      <Block at={[0, height / 2, 0]} size={[.04, height + .7, .04]} color={n === 2 || n === 5 ? "#ebad9b" : "#9ae1ce"} glow />
    </group>)}</group>
    <Line color="#cbdcbb" points={[[-3, 1.2, 2], [-2, 1.8, 2], [-1, 1.5, 2], [0, 2.3, 2], [1, 3.1, 2], [2, 2.7, 2], [3, 3.8, 2]]} />
  </group>;
}

function LunarIsland({ color, travel }: LandmarkProps) {
  const satellite = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!travel.current.paused && !travel.current.reduced && satellite.current) {
      satellite.current.position.x = Math.sin(clock.elapsedTime * .15) * 2;
      satellite.current.position.y = 4.3 + Math.cos(clock.elapsedTime * .3) * .2;
    }
  });
  return <group>
    {[[-2.8, .3, 1.8, 1.4], [2.8, .15, -1.8, 1], [3.2, .1, 2.5, .65]].map(([x, y, z, radius], n) => <mesh key={n} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[radius, .17, 7, 30]} /><meshStandardMaterial color="#7b7c74" roughness={1} /></mesh>)}
    <group position={[-.5, .7, 1.4]} rotation={[0, -.25, 0]}>
      <Block at={[0, .2, 0]} size={[1.8, .55, 1.15]} color="#b8afa0" />
      <Block at={[0, .55, 0]} size={[1.5, .12, 1.35]} color="#274875" />
      {[-.7, 0, .7].flatMap(x => [-.65, .65].map(z => <mesh key={x + ":" + z} position={[x, -.12, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.3, .3, .17, 12]} /><meshStandardMaterial color="#37424c" /></mesh>))}
      <Block at={[.55, 1.15, -.2]} size={[.06, 1.2, .06]} color="#c0c4ba" />
      <Block at={[.55, 1.7, -.2]} size={[.5, .22, .25]} color="#385466" />
    </group>
    <group ref={satellite} position={[0, 4.3, -1.2]} rotation={[.12, -.2, .2]}>
      <Block at={[0, 0, 0]} size={[.7, .7, .6]} color="#cebc8a" />
      {[-1.25, 1.25].map(x => <group key={x}>
        <Block at={[x, 0, 0]} size={[1.6, .07, 1.3]} color="#345989" />
        {[-.35, 0, .35].map(z => <Block key={z} at={[x, .045, z]} size={[1.55, .015, .02]} color="#94b5cb" glow />)}
      </group>)}
    </group>
    <Sign label="OHRC / LUNAR RESEARCH" color={color} at={[0, 2.2, -2.7]} width={4.8} height={1.4} kind="lunar" />
  </group>;
}

function ArsenalIsland({ color, travel }: LandmarkProps) {
  const core = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!travel.current.paused && !travel.current.reduced && core.current) core.current.rotation.y += delta * .2;
  });
  return <group>
    <mesh position={[0, .35, 0]}><cylinderGeometry args={[5.5, 5.8, .6, 6]} /><meshStandardMaterial color="#384752" metalness={.6} roughness={.55} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .66, 0]}><ringGeometry args={[4.9, 5, 6]} /><meshBasicMaterial color={color} /></mesh>
    <Sign label="THE ARSENAL / TECH STACK" color={color} at={[0, 4.3, -1.8]} width={6.8} height={2.4} kind="arsenal" />
    {[-3.9, 3.9].map((x, side) => <group key={x} position={[x, .7, .1]} rotation={[0, side ? -.2 : .2, 0]}>
      <Block at={[0, 1.35, 0]} size={[1.4, 2.7, 1.2]} color="#1a2b38" />
      {[0, 1, 2, 3, 4].map(n => <group key={n}>
        <Block at={[0, .4 + n * .46, .63]} size={[1.12, .27, .04]} color="#49616e" />
        <Block at={[.38, .4 + n * .46, .66]} size={[.1, .05, .025]} color={n % 2 ? "#8ed9cf" : color} glow />
      </group>)}
    </group>)}
    <group ref={core} position={[0, 1.9, .6]}>
      <mesh><octahedronGeometry args={[.95]} /><meshStandardMaterial color="#718cb2" emissive="#aec8e9" emissiveIntensity={.25} metalness={.8} roughness={.2} /></mesh>
      <mesh rotation={[.65, .4, .2]}><torusGeometry args={[1.6, .035, 8, 70]} /><meshBasicMaterial color={color} /></mesh>
    </group>
    {[-2.1, 0, 2.1].map((x, n) => <group key={n}>
      <Line color={["#87c5da", "#d8bd86", "#9bceb6"][n]} thickness={.025} points={[[x, .75, 3.8], [x, .8, 2.5], [0, .85, 1]]} />
      <Sign label={["ENGINEER", "ANALYZE", "BUILD"][n]} color={color} at={[x, .9, 3.8]} width={1.65} height={.75} kind="arsenal" rotation={[-.35, 0, 0]} />
    </group>)}
  </group>;
}

function SignalStation({ color, travel }: LandmarkProps) {
  const dish = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!travel.current.paused && !travel.current.reduced && dish.current) dish.current.rotation.y = Math.sin(clock.elapsedTime * .15) * .3;
  });
  return <group>
    <Block at={[0, 1.2, 0]} size={[2.5, 2.4, 2]} color="#567181" />
    <group ref={dish} position={[0, 3.5, 0]}>
      <mesh rotation={[Math.PI / 2 - .45, 0, 0]}><sphereGeometry args={[2.5, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2.3]} /><meshStandardMaterial color="#a6bbc2" side={THREE.DoubleSide} metalness={.5} roughness={.45} /></mesh>
      <Line color={color} points={[[0, 0, 0], [0, 1.4, 1], [0, 2.2, 1.4]]} />
      {[2.3, 3.5, 4.7].map((radius, n) => <mesh key={n} position={[0, 1.6 + n * .6, 1.7 + n * .8]} rotation={[-.3, 0, 0]}><torusGeometry args={[radius * .35, .018, 6, 50]} /><meshBasicMaterial color={color} transparent opacity={.55 - n * .12} /></mesh>)}
    </group>
    <Sign label="MAKE CONTACT / EARTH" color={color} at={[-3.9, 2.1, .3]} width={2.5} height={1.4} kind="signal" />
  </group>;
}

export default function ProjectLandmarks(props: LandmarkProps) {
  if (props.index === 1) return <TransitIsland {...props} />;
  if (props.index === 2) return <SalesIsland {...props} />;
  if (props.index === 3) return <MedicalIsland {...props} />;
  if (props.index === 4) return <FuelIsland {...props} />;
  if (props.index === 5) return <CustomerIsland {...props} />;
  if (props.index === 6) return <MarketIsland {...props} />;
  if (props.index === 7) return <LunarIsland {...props} />;
  // These are visual designs, deliberately independent of chapter ordering.
  if (props.index === 8) return <ArsenalIsland {...props} />;
  if (props.index === 9) return <SignalStation {...props} />;
  return null;
}
