"use client";

import { useEffect, useRef } from "react";

export default function UfoCursor({ paused, reduced }: { paused: boolean; reduced: boolean }) {
  const ship = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ship.current;
    const tail = trail.current;
    if (!element || !tail) return;
    const target = { x: innerWidth * .7, y: innerHeight * .55, active: false, touch: false, down: false, hover: false, last: 0 };
    const position = { x: target.x, y: target.y, tilt: 0 };
    const traces = Array.from(tail.children) as HTMLElement[];
    const history = traces.map(() => ({ x: target.x, y: target.y }));
    let frame = 0;
    let previous = performance.now();
    const move = (event: PointerEvent) => {
      if (paused || event.target instanceof Element && event.target.closest("dialog")) { target.active = false; return; }
      const first = !target.active;
      target.touch = event.pointerType === "touch";
      target.x = event.clientX;
      target.y = event.clientY - (target.touch ? 42 : 0);
      target.hover = event.target instanceof Element && !!event.target.closest("button,a");
      target.last = performance.now();
      target.active = true;
      if (first) {
        position.x = target.x; position.y = target.y;
        history.forEach(point => { point.x = target.x; point.y = target.y; });
      }
    };
    const down = (event: PointerEvent) => { target.down = true; move(event); };
    const up = () => { target.down = false; };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) target.active = false; };
    const hide = () => { target.active = false; };
    const animate = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .05);
      previous = now;
      const visible = !paused && !document.hidden && target.active && (!target.touch || target.down || now - target.last < 700);
      const dx = target.x - position.x;
      const speed = Math.min(1, Math.hypot(dx, target.y - position.y) / 65);
      const damping = reduced ? 1 : 1 - Math.exp(-20 * dt);
      position.x += dx * damping;
      position.y += (target.y - position.y) * damping;
      position.tilt += ((reduced ? 0 : Math.max(-24, Math.min(24, dx * .55))) - position.tilt) * damping;
      element.style.transform = `translate3d(${position.x}px,${position.y}px,0) rotate(${position.tilt}deg) scale(${target.down ? .88 : target.hover ? 1.16 : 1})`;
      element.style.opacity = visible ? "1" : "0";
      element.style.setProperty("--thrust", String(.2 + speed * .8));
      element.dataset.mode = target.hover ? "hover" : target.down ? "flight" : "cruise";
      element.dataset.pointer = target.touch ? "touch" : "mouse";
      document.documentElement.dataset.ufoCursor = String(visible && !target.touch);
      let anchor: { x: number; y: number } = position;
      history.forEach((point, index) => {
        point.x += (anchor.x - point.x) * (reduced ? 1 : .23);
        point.y += (anchor.y - point.y) * (reduced ? 1 : .23);
        traces[index].style.transform = `translate3d(${point.x}px,${point.y + 12}px,0) scale(${1 - index * .1})`;
        traces[index].style.opacity = visible && !reduced ? String((.46 - index * .06) * speed) : "0";
        anchor = point;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", hide, { passive: true });
    document.addEventListener("pointerout", leave, { passive: true });
    window.addEventListener("blur", hide);
    return () => {
      cancelAnimationFrame(frame);
      delete document.documentElement.dataset.ufoCursor;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", hide);
      document.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", hide);
    };
  }, [paused, reduced]);
  return <div className="ufo-flight-layer" aria-hidden="true">
    <div className="ufo-trail" ref={trail}>{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
    <div className="ufo-cursor" ref={ship}>
      <div className="ufo-aura" />
      <svg viewBox="0 0 80 64" fill="none">
        <defs><linearGradient id="ufo-metal" x2="0" y2="1"><stop stopColor="#eff9ee" /><stop offset=".48" stopColor="#8bb7bc" /><stop offset="1" stopColor="#345467" /></linearGradient><linearGradient id="ufo-glass" x2=".5" y2="1"><stop stopColor="#b8f4dc" /><stop offset="1" stopColor="#36839a" stopOpacity=".7" /></linearGradient></defs>
        <path className="ufo-beam" d="m32 39-9 23h34l-9-23" fill="#a4f5dd" opacity=".12" />
        <ellipse cx="40" cy="37" rx="30" ry="10" fill="#2c4c61" stroke="#a9d9d4" strokeWidth="1.2" />
        <path d="M10 35c9-14 51-14 60 0-8 11-52 11-60 0Z" fill="url(#ufo-metal)" stroke="#c2ded8" strokeWidth="1" />
        <path d="M25 29c0-24 30-24 30 0-7 6-23 6-30 0Z" fill="url(#ufo-glass)" stroke="#c4efdf" />
        <ellipse cx="40" cy="23" rx="5.5" ry="6" fill="#81d6b5" /><path d="m37 22 1 2m4-2-1 2" stroke="#0a3f50" strokeWidth="2" strokeLinecap="round" />
        <path d="M29 17c1-4 4-7 8-8" stroke="#e2fff1" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
        {[21, 33, 47, 59].map((x, i) => <ellipse key={x} cx={x} cy={i === 0 || i === 3 ? 36 : 39} rx="2.2" ry="1.4" fill={i % 2 ? "#ffdf9a" : "#b8ffe1"} />)}
        <ellipse className="ufo-engine" cx="40" cy="45" rx="12" ry="2.5" fill="#a3ffe1" />
      </svg>
      <span className="ufo-target" />
    </div>
  </div>;
}
