"use client";

import { type MutableRefObject, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type TravelState } from "@/lib/world";

type V3 = [number, number, number];
type Shape = "box" | "cone" | "sphere" | "cylinder" | "light";
type Detail = { at: V3; size: V3; color: string; rotation?: V3 };
type Details = Record<Shape, Detail[]>;
type Props = { index: number; color: string; travel: MutableRefObject<TravelState>; compact?: boolean };

// Scenery is baked into five instanced batches, so a hundred little objects
// cost only five draw calls. The nearby island window owns their lifetime.
function DetailBatch({ shape, details }: { shape: Shape; details: Detail[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new THREE.Object3D();
    const color = new THREE.Color();
    details.forEach((detail, index) => {
      transform.position.set(...detail.at);
      transform.scale.set(...detail.size);
      transform.rotation.set(...(detail.rotation ?? [0, 0, 0]));
      transform.updateMatrix();
      mesh.current!.setMatrixAt(index, transform.matrix);
      mesh.current!.setColorAt(index, color.set(detail.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [details]);
  if (!details.length) return null;
  return <instancedMesh ref={mesh} args={[undefined, undefined, details.length]}>
    {(shape === "box" || shape === "light") && <boxGeometry />}
    {shape === "cone" && <coneGeometry args={[1, 1, 6]} />}
    {shape === "sphere" && <icosahedronGeometry args={[1, 0]} />}
    {shape === "cylinder" && <cylinderGeometry args={[1, 1, 1, 8]} />}
    {shape === "light" ? <meshBasicMaterial toneMapped={false} /> : <meshStandardMaterial roughness={.72} metalness={.18} flatShading />}
  </instancedMesh>;
}

function scenery(index: number, color: string, compact: boolean): Details {
  const result: Details = { box: [], cone: [], sphere: [], cylinder: [], light: [] };
  const add = (shape: Shape, at: V3, size: V3, tint: string, rotation?: V3) => result[shape].push({ at, size, color: tint, rotation });
  const box = (at: V3, size: V3, tint = "#66818a", rotation?: V3) => add("box", at, size, tint, rotation);
  const light = (at: V3, size: V3, tint = color, rotation?: V3) => add("light", at, size, tint, rotation);
  const pine = (x: number, z: number, size = 1, tint = "#477a78") => {
    box([x, size * .75, z], [.16 * size, size * 1.5, .16 * size], "#8b775b");
    add("cone", [x, size * 1.55, z], [.68 * size, size * 1.35, .68 * size], tint);
    add("cone", [x, size * 2.15, z], [.48 * size, size, .48 * size], tint);
  };
  const person = (x: number, z: number, tint: string, y = .2) => {
    box([x, y + .45, z], [.25, .47, .22], tint);
    add("sphere", [x, y + .84, z], [.18, .19, .18], "#d4b79a");
    [-.075, .075].forEach(dx => box([x + dx, y + .13, z], [.08, .28, .1], "#344758"));
    box([x, y + .85, z - .13], [.3, .2, .08], "#334456");
  };
  const crate = (x: number, z: number, size = .6, tint = "#9e8761", y = .2) => {
    box([x, y + size / 2, z], [size, size, size], tint);
    light([x, y + size + .01, z], [size * .75, .025, .07], "#d2cba7");
    box([x, y + size / 2, z + size / 2 + .01], [size * .75, .06, .025], "#555e5c");
  };
  const lamp = (x: number, z: number, height = 2.4) => {
    box([x, height / 2, z], [.085, height, .085], "#718c98");
    box([x + .27, height, z], [.62, .08, .14], "#718c98");
    light([x + .4, height - .05, z], [.25, .04, .11], "#ffe1a2");
  };
  const panel = (x: number, z: number, y = .9, width = 1.7) => {
    box([x, y / 2, z], [.12, y, .12], "#b3c4c1");
    box([x, y, z], [width, .1, 1.05], "#2f5584", [-.22, 0, 0]);
    [-.32, 0, .32].forEach(dz => light([x, y + .065 + dz * .22, z + dz], [width - .08, .015, .015], "#83b6cf", [-.22, 0, 0]));
  };

  if (index === 0) {
    // An expedition base: forest, observatory steps, glowing mineral garden.
    [[-5.6, -1.2, 1.2], [-4.8, -2.6, 1.55], [-3.6, -3.5, .9], [4.6, -2.4, 1.25], [5.7, -.8, .85], [5, 2.7, .7]].forEach(([x, z, scale]) => pine(x, z, scale));
    for (let n = 0; n < 7; n++) box([-2.3 + n * .35, .1 + n * .04, 3.7 - n * .55], [1.3, .15, .42], n % 2 ? "#7e9697" : "#546c76", [0, -.3, 0]);
    box([-3.8, .2, 1.5], [2, .18, 1.7], "#59666b");
    add("cone", [-3.8, 1.05, 1.5], [1.4, 1.6, 1.1], "#c39d63", [0, Math.PI / 4, 0]);
    box([-3.8, .65, 2.2], [.55, .8, .035], "#1b3442");
    crate(-5.1, 1.7, .5); crate(-5, 2.4, .4, "#71888c");
    lamp(-1.7, 3.5, 1.3); lamp(3.2, 2.9, 1.3);
    [[3, 2.4], [3.4, 2.6], [3.8, 2.3]].forEach(([x, z], n) => add("cone", [x, .5 + n * .12, z], [.18, .8 + n * .2, .18], ["#8bc7d3", "#d0b6e4", "#88d7c0"][n], [.1, n, .2]));
    person(-2.1, 1.9, "#d0a46d");
  }

  if (index === 1) {
    // A lived-in transit terminal with a pedestrian crossing and ticket queue.
    box([-2.7, .95, -1.65], [3, 1.2, .05], "#497581");
    for (let n = 0; n < 6; n++) box([-4.7 + n * .35, .28, 1.8], [.18, .02, 2.6], "#cdd6cb");
    [[-3.7, -.8], [-3.1, -.8], [-1.5, .1], [-.4, -.2]].forEach(([x, z], n) => person(x, z, ["#d8ae6e", "#a6a0cd", "#81c5b8", "#d59782"][n]));
    box([3.5, .9, -1.7], [1.1, 1.8, .75], "#51778b");
    light([3.5, 1.2, -1.3], [.72, .45, .035]);
    box([3.5, .61, -1.3], [.4, .04, .035], "#162f40");
    lamp(-5.5, 0, 3.5); lamp(5.4, 0, 3.5);
    pine(5.3, -2.8, 1.05); pine(-5.3, -2.6, .85);
    box([4.9, .45, 2.6], [.75, .9, .65], "#708a7e");
    light([4.9, .93, 2.6], [.8, .05, .7], "#99c5ad");
    for (let n = 0; n < 6; n++) box([-2.5 + n * .9, .25, 3.55], [.45, .3, .1], n % 2 ? "#c4cab3" : "#5d706c");
  }

  if (index === 2) {
    // Automation as a little fulfilment factory; parcels follow the pipeline.
    box([0, .6, 3.3], [8.6, .4, .9], "#405764");
    for (let n = 0; n < (compact ? 9 : 17); n++) add("cylinder", [-4 + n * (compact ? 1 : .5), .85, 3.3], [.09, .8, .09], "#8b9b9d", [Math.PI / 2, 0, 0]);
    [-3.5, -1.6, .3, 2.8].forEach((x, n) => crate(x, 3.3, .45, ["#c3a576", "#83aeb1", "#b3a3c4", "#b8bd83"][n], .86));
    [[-4.6, -2.5], [-4, -2.5], [-4.4, -1.8], [4.7, -2.5]].forEach(([x, z], n) => crate(x, z, .6, n % 2 ? "#92a7a7" : "#b29467"));
    box([4.8, 1.1, -.8], [.8, 2.2, 1.1], "#405d6e");
    for (let n = 0; n < 3; n++) light([4.8, .55 + n * .47, -.22], [.54, .12, .025], n === 1 ? "#d9be80" : color);
    [-4.8, 4.8].forEach(x => lamp(x, 2.5, 2.1));
    person(-4, .5, "#dbbb80");
  }

  if (index === 3) {
    // A research lab, with a circular scan gantry and specimen carts.
    box([3, 2.7, -1.1], [1.7, .18, .5], "#d0dcd5");
    [-.85, .85].forEach(x => box([3 + x, 1.8, -1.1], [.14, 1.8, .5], "#a5bfc2"));
    light([3, 2.6, -.82], [1.5, .04, .04]);
    box([-4, .8, 1.9], [1.15, .12, 1.5], "#aabcc0");
    box([-4, .35, 1.9], [.9, .1, 1.3], "#849ba5");
    [-.4, .4].flatMap(dx => [-.5, .5].map(dz => box([-4 + dx, .45, 1.9 + dz], [.06, .8, .06], "#6c8592")));
    for (let n = 0; n < 4; n++) {
      add("cylinder", [-4.3 + n * .2, 1.02, 1.5], [.055, .35, .055], ["#9bd9d0", "#bbacdf", "#e1c3a1", "#81b8d1"][n]);
      add("cylinder", [-4.3 + n * .2, 1.22, 1.5], [.067, .04, .067], "#e1e4d3");
    }
    [-3.8, -3.1].forEach(x => {
      add("cylinder", [x, .7, -2.8], [.2, 1.1, .2], "#8ba6b0");
      box([x, 1.32, -2.8], [.16, .14, .14], "#d2cdad");
    });
    person(.6, 2.3, "#d3e1dc");
    box([-.3, .25, 3.1], [2.5, .03, .2], "#8fc6c5");
    box([-.3, .26, 3.1], [.2, .03, 1], "#8fc6c5");
  }

  if (index === 4) {
    // Roadside safety: bollards, cones, service equipment and a checkpoint.
    [-4.2, -2.8, 2.8, 4.2].forEach(x => {
      box([x, .3, 3.3], [.45, .1, .45], "#2a3841");
      add("cone", [x, .65, 3.3], [.2, .65, .2], "#d98e59");
      add("cylinder", [x, .66, 3.3], [.13, .1, .13], "#d6d7bd");
    });
    [-3.5, -2.3, 2.3, 3.5].forEach(x => {
      add("cylinder", [x, .65, -.5], [.08, .85, .08], "#e3bb6c");
      add("cylinder", [x, .9, -.5], [.085, .16, .085], "#394649");
    });
    box([-5.6, .6, 1.8], [.35, 1.2, .35], "#bcad8a");
    box([-4.65, 1.2, 1.8], [2.2, .18, .16], "#d2c4a2", [0, 0, -.28]);
    for (let n = 0; n < 4; n++) box([-5.3 + n * .42, 1.2 - (n - 1) * .12, 1.9], [.22, .18, .025], "#52626a", [0, 0, -.28]);
    [4.8, 5.4].forEach(x => {
      add("cylinder", [x, .65, -2.6], [.26, .9, .26], "#688a91");
      add("cylinder", [x, .65, -2.6], [.275, .075, .275], "#b6b8a1");
    });
    box([-5.3, .8, -2.3], [.7, 1.5, .6], "#a96a56");
    box([-5.3, 1.3, -1.98], [.35, .22, .025], "#d9d4b9");
    person(1.4, -.8, "#deb769");
    [[-6.4, -1], [6.4, 1]].forEach(([x, z]) => add("cone", [x, .5, z], [.25, .7, .25], "#7a9d78"));
  }

  if (index === 5) {
    // A colourful marketplace gives the customer clusters a human setting.
    [[-4.6, -1.7], [4.5, -1.8], [-4.8, 1.8], [4.8, 1.7]].forEach(([x, z], n) => {
      const tint = ["#caac77", "#8cc6bc", "#baaad2", "#d29a91"][n];
      box([x, .5, z], [1.1, .8, .8], "#63827b");
      box([x, 1.6, z], [1.5, .14, 1.15], tint, [0, 0, n % 2 ? .05 : -.05]);
      [-.6, .6].forEach(dx => box([x + dx, .95, z - .4], [.06, 1.6, .06], "#b6b2a0"));
      for (let n = 0; n < 3; n++) add("sphere", [x - .3 + n * .3, 1, z + .1], [.12, .12, .12], ["#d4ab73", "#a7c18e", "#c98275"][n]);
      light([x, 1.35, z + .54], [.75, .06, .025], tint);
    });
    [[-3.8, -3.1], [3.5, -3.2], [-5.7, .1], [5.7, .1]].forEach(([x, z], n) => pine(x, z, .7 + n * .08, n % 2 ? "#6c9e84" : "#588b88"));
    for (let n = 0; n < 9; n++) box([-2.7 + n * .7, .14, 3.8 + Math.sin(n) * .15], [.4, .12, .3], "#91a899", [0, n, 0]);
  }

  if (index === 6) {
    // A financial observatory: city skyline and a bank of research terminals.
    [[-4.4, -2.2, 2.4], [-3.5, -2.8, 3.3], [3.9, -2.4, 3.6], [4.9, -1.8, 2.1]].forEach(([x, z, h], n) => {
      box([x, h / 2 + .25, z], [.75, h, .8], ["#3e566e", "#4b6278", "#627a8c", "#455e73"][n]);
      for (let row = 0; row < Math.floor(h * 2); row++) [-.2, .2].forEach(dx => light([x + dx, .65 + row * .43, z + .41], [.12, .13, .025], row % 3 ? "#9ebec7" : "#e8c58d"));
      light([x, h + .29, z], [.6, .04, .66], color);
    });
    [-3.6, -.9, 1.8, 4.3].forEach((x, n) => {
      box([x, .7, 3.35], [1.4, .15, .8], "#6b7d8a");
      box([x, .35, 3.35], [.15, .7, .15], "#455a6b");
      box([x, 1.15, 3.15], [.9, .55, .08], "#1f3447");
      light([x, 1.15, 3.2], [.78, .4, .025], n % 2 ? "#84c9bd" : "#92b7d7");
      box([x, .81, 3.5], [.65, .04, .23], "#a3b1b5");
    });
    person(-4.2, 1.8, "#c3b38f");
  }

  if (index === 7) {
    // Lunar research outpost with solar arrays, sample cases and landing pad.
    panel(-4.2, -1.6, 1.1, 2.2); panel(-4.2, -3, 1.1, 2.2);
    add("sphere", [3.8, .5, -1.4], [1.35, 1.1, 1.25], "#b9b9a5");
    box([3.8, .5, -.1], [.65, .9, .25], "#384d60");
    light([3.8, .85, .045], [.45, .25, .035], "#aec9d7");
    crate(4.9, .4, .55, "#b6a780"); crate(4.8, 1.15, .45, "#8d9b9c");
    add("cylinder", [1.2, .08, 2.4], [1, .1, 1], "#596870");
    box([1.2, .15, 2.4], [1, .02, .1], "#d5caa7");
    box([1.2, .15, 2.4], [.1, .02, 1], "#d5caa7");
    box([3.5, 1.6, 2.8], [.06, 3.1, .06], "#bbc5bf");
    box([3.95, 2.65, 2.8], [.85, .5, .035], "#d5b67b");
    light([3.95, 2.65, 2.83], [.48, .07, .02], "#e3dfc6");
    for (let n = 0; n < (compact ? 5 : 10); n++) box([-.8 + n * .23, .13, 2.6 + Math.sin(n * .7) * .23], [.1, .02, .15], "#697675", [0, .4, 0]);
    person(2.4, .6, "#e0d7b9");
    box([2.4, 1.01, .78], [.27, .12, .05], "#4c7691");
  }

  if (index === 8) {
    // The arsenal is a workshop: fabrication bench, tools and circuit floor.
    box([-2.6, 1.05, 2], [2.1, .17, 1.25], "#8c9da2");
    [-3.4, -1.8].forEach(x => box([x, .65, 2], [.15, .8, .9], "#526776"));
    box([-2.6, 1.23, 2], [1.2, .12, .75], "#2f5268");
    for (let n = 0; n < 6; n++) light([-3.1 + n * .2, 1.31, 2], [.09, .025, .35], n % 2 ? "#d4bb8d" : color);
    box([2.8, 1.8, -2.4], [1.7, 2.4, .15], "#506270");
    for (let n = 0; n < 4; n++) {
      box([2.25 + n * .35, 2.1, -2.28], [.075, .65 + n % 2 * .2, .07], "#b5c2bf");
      box([2.25 + n * .35, 2.4 + n % 2 * .1, -2.28], [.22, .12, .08], "#d4b477");
    }
    crate(-4.5, -2, .65, "#697b86"); crate(-3.9, -2.1, .45, "#b39a73", .85);
    crate(4.1, 2.8, .55, "#6c8e98");
    [-2, 0, 2].forEach((x, n) => {
      light([x, .69, -.6], [.045, .025, 5.5], ["#8eb8d8", "#d0b780", "#8dc6b3"][n]);
      add("cylinder", [x, .7, -3.35], [.16, .035, .16], color);
    });
    box([0, 1.1, -3.7], [3, .6, .6], "#334958");
    for (let n = 0; n < 7; n++) light([-1.2 + n * .4, 1.13, -3.38], [.16, .16, .035], ["#8fcae2", "#d8bd83", "#97d2b5"][n % 3]);
  }

  if (index === 9) {
    // A communications harbour, with a lighthouse and a little departure dock.
    for (let n = 0; n < 9; n++) box([3.7, .3, 1.2 + n * .38], [1.5, .16, .28], n % 2 ? "#8c8974" : "#697d81");
    [2.95, 4.45].forEach(x => [1.2, 3.9].forEach(z => box([x, .65, z], [.1, 1.1, .1], "#a1a793")));
    box([-4.9, 1.6, -1.8], [1, 3.2, 1], "#8ba0a7");
    box([-4.9, 2.4, -1.8], [1.03, .25, 1.03], "#547787");
    light([-4.9, 3.35, -1.8], [.8, .45, .8], "#f2d1a1");
    add("cone", [-4.9, 3.9, -1.8], [.95, .8, .95], "#5b7b8d");
    pine(-4.4, 1.8, .8); pine(4, -2.8, 1.25); pine(5.2, -1.4, .8);
    box([1.8, .8, 2.9], [.13, 1.6, .13], "#9f9d89");
    box([1.8, 1.5, 2.9], [.8, .5, .5], "#a87360");
    box([1.8, 1.55, 3.16], [.5, .055, .025], "#e5d5b8");
    person(3.7, 2.6, "#d4b77b", .4);
  }
  return result;
}

function CourierDrone({ index, color, travel }: Pick<Props, "index" | "color" | "travel">) {
  const drone = useRef<THREE.Group>(null);
  const propeller = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (travel.current.paused || travel.current.reduced) return;
    if (drone.current) {
      drone.current.position.y = 3.1 + Math.sin(clock.elapsedTime * .8 + index) * .35;
      drone.current.position.x = -5.7 + Math.sin(clock.elapsedTime * .28 + index) * .5;
      drone.current.rotation.z = Math.sin(clock.elapsedTime * .8) * .06;
    }
    if (propeller.current) propeller.current.rotation.y += Math.min(delta, .05) * 7;
  });
  return <group ref={drone} position={[-5.7, 3.1, 1.3]} scale={.7}>
    <mesh><boxGeometry args={[.8, .45, .6]} /><meshStandardMaterial color="#c6c4aa" metalness={.4} roughness={.5} /></mesh>
    <mesh position={[0, .03, .32]}><boxGeometry args={[.48, .13, .035]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={[0, .3, 0]}><cylinderGeometry args={[.06, .06, .3, 6]} /><meshStandardMaterial color="#4a6673" /></mesh>
    <group ref={propeller} position={[0, .48, 0]}>
      <mesh><boxGeometry args={[1.9, .035, .12]} /><meshStandardMaterial color="#8aa8af" /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[1.9, .035, .12]} /><meshStandardMaterial color="#8aa8af" /></mesh>
    </group>
    {index === 2 && <mesh position={[0, -.45, 0]}><boxGeometry args={[.5, .42, .42]} /><meshStandardMaterial color="#c5a475" /></mesh>}
  </group>;
}

function RobotArm({ color, travel }: Pick<Props, "color" | "travel">) {
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (travel.current.paused || travel.current.reduced) return;
    if (shoulder.current) shoulder.current.rotation.y = Math.sin(clock.elapsedTime * .45) * .35;
    if (elbow.current) elbow.current.rotation.z = -.75 + Math.sin(clock.elapsedTime * .9) * .22;
  });
  return <group position={[2.5, .68, 1.4]}>
    <mesh position={[0, .2, 0]}><cylinderGeometry args={[.6, .7, .4, 8]} /><meshStandardMaterial color="#829395" metalness={.55} roughness={.45} /></mesh>
    <group ref={shoulder} position={[0, .4, 0]}>
      <mesh position={[0, .6, 0]} rotation={[0, 0, -.22]}><boxGeometry args={[.3, 1.3, .35]} /><meshStandardMaterial color="#c29a59" metalness={.45} roughness={.45} /></mesh>
      <mesh position={[.14, 1.25, 0]}><sphereGeometry args={[.24, 8, 6]} /><meshStandardMaterial color="#536e7e" /></mesh>
      <group ref={elbow} position={[.14, 1.25, 0]} rotation={[0, 0, -.75]}>
        <mesh position={[0, .6, 0]}><boxGeometry args={[.22, 1.1, .25]} /><meshStandardMaterial color="#ceaa69" metalness={.45} roughness={.45} /></mesh>
        <mesh position={[0, 1.2, 0]}><boxGeometry args={[.42, .15, .3]} /><meshStandardMaterial color="#4a6372" /></mesh>
        {[-.16, .16].map(x => <mesh key={x} position={[x, 1.38, 0]}><boxGeometry args={[.08, .25, .1]} /><meshStandardMaterial color="#9bacb0" /></mesh>)}
        <mesh position={[0, 1.47, 0]}><octahedronGeometry args={[.14]} /><meshBasicMaterial color={color} /></mesh>
      </group>
    </group>
  </group>;
}

function Flightcraft({ color, travel, contact }: Pick<Props, "color" | "travel"> & { contact: boolean }) {
  const craft = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!craft.current || travel.current.paused || travel.current.reduced) return;
    craft.current.position.y = 5.6 + Math.sin(clock.elapsedTime * .4) * .35;
    craft.current.rotation.z = -.12 + Math.sin(clock.elapsedTime * .3) * .08;
  });
  return <group ref={craft} position={[5.2, 5.6, -1.2]} rotation={[0, -.5, -.12]} scale={contact ? .75 : 1}>
    <mesh rotation={[0, 0, -Math.PI / 2]}><capsuleGeometry args={[.3, 1.7, 3, 8]} /><meshStandardMaterial color="#aebec0" metalness={.45} roughness={.6} /></mesh>
    <mesh position={[-.1, 0, 0]} rotation={[0, .12, 0]}><boxGeometry args={[.65, .07, 3]} /><meshStandardMaterial color="#6d939f" metalness={.3} roughness={.6} /></mesh>
    <mesh position={[-1, .22, 0]}><boxGeometry args={[.5, .55, .08]} /><meshStandardMaterial color="#e0bd82" /></mesh>
    <mesh position={[.6, .25, 0]}><boxGeometry args={[.45, .16, .4]} /><meshStandardMaterial color="#2e5068" /></mesh>
    <mesh position={[-1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[.15, .7, 6]} /><meshBasicMaterial color={color} transparent opacity={.6} /></mesh>
  </group>;
}

export default function WorldDetails({ index, color, travel, compact = false }: Props) {
  const details = useMemo(() => scenery(index, color, compact), [index, color, compact]);
  return <group>
    {(Object.keys(details) as Shape[]).map(shape => <DetailBatch key={shape} shape={shape} details={details[shape]} />)}
    {[1, 2, 3, 4, 6, 7].includes(index) && <CourierDrone index={index} color={color} travel={travel} />}
    {index === 8 && <RobotArm color={color} travel={travel} />}
    {(index === 0 || index === 9) && <Flightcraft color={color} travel={travel} contact={index === 9} />}
  </group>;
}
