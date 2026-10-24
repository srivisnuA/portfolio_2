// An immediate, server-rendered view of the atlas while the 3D engine arrives.
// No images, JavaScript animation, fonts, or GPU context are needed to display it.
export default function WorldPoster({ hidden }: { hidden: boolean }) {
  return <svg className={"world-poster" + (hidden ? " is-hidden" : "")} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
    <defs>
      <linearGradient id="atlas-sky" x2="0" y2="1"><stop stopColor="#081827" /><stop offset=".68" stopColor="#244354" /><stop offset="1" stopColor="#0b2030" /></linearGradient>
      <linearGradient id="atlas-rock" x2=".3" y2="1"><stop stopColor="#456373" /><stop offset="1" stopColor="#122431" /></linearGradient>
      <radialGradient id="atlas-haze"><stop stopColor="#90b1bb" stopOpacity=".16" /><stop offset="1" stopColor="#90b1bb" stopOpacity="0" /></radialGradient>
    </defs>
    <path fill="url(#atlas-sky)" d="M0 0h1440v900H0z" />
    <ellipse fill="url(#atlas-haze)" cx="950" cy="340" rx="530" ry="360" />
    {Array.from({ length: 65 }, (_, i) => <circle key={i} cx={(i * 337 + 43) % 1440} cy={(i * 113 + 29) % 490} r={i % 4 === 0 ? 1.3 : .7} fill="#c8d8de" opacity={.25 + i % 5 * .1} />)}
    <circle cx="1124" cy="161" r="43" fill="#96adb5" opacity=".48" />
    <circle cx="1112" cy="150" r="8" fill="#55727e" opacity=".35" />
    <circle cx="1132" cy="178" r="13" fill="#55727e" opacity=".27" />
    <path fill="#213d4e" d="m0 585 92-80 63 42 117-169 95 123 65-30 108 116 96-144 66 52 73-127 98 154 111-73 79 126 90-98 76 24 111-139 100 147v396H0Z" />
    <path fill="#193343" d="m0 626 150-54 122 34 111-105 132 144 145-42 84-72 133 76 127-34 87 80 124-74 125 29v292H0Z" />
    <path d="M-50 746Q250 545 600 673T1490 568" fill="none" stroke="#c9b88a" strokeWidth="1" opacity=".23" />
    <g transform="translate(920 490)">
      <path d="m-188 6 71-71 135-13 148 62-37 48-104 120-91-13Z" fill="url(#atlas-rock)" />
      <path d="m-188 6 71-71 135-13 148 62-96 49-144 9Z" fill="#546e77" />
      <path d="m-74 42 99 110L18-78M-188 6l213 146 45-185" fill="none" stroke="#6b8790" opacity=".14" />
      <ellipse cy="-6" rx="43" ry="14" fill="#263c47" />
      <g fill="none" stroke="#d2bf91" strokeWidth="2">
        <ellipse cy="-106" rx="76" ry="90" transform="rotate(-28 0 -106)" />
        <ellipse cy="-106" rx="89" ry="31" transform="rotate(32 0 -106)" opacity=".8" />
        <ellipse cy="-106" rx="51" ry="77" transform="rotate(43 0 -106)" opacity=".45" />
      </g>
      <path d="m0-135 24 17-6 30-29 8-17-28Z" fill="#75a9b5" />
      <path d="m0-135 4 32 20-15M4-103l-15 23" fill="none" stroke="#c8dbd7" opacity=".65" />
      {[-132, 104].map(x => <g key={x} transform={`translate(${x} -4)`}><path d="M-5 0h10v-28H-5Z" fill="#293e49" /><path d="M-3-27h6v4h-6Z" fill="#e8d6a3" /></g>)}
    </g>
    <g transform="translate(1320 525) scale(.48)"><path d="m-120 0 80-50 140 37-32 58-110 77Z" fill="#284552" /><path d="m-120 0 80-50 140 37-92 38Z" fill="#526d76" /><path d="M0 2V-98M-32-78h64" stroke="#b8b592" strokeWidth="3" /><circle cy="-99" r="19" stroke="#a1b6bd" fill="none" /></g>
  </svg>;
}
