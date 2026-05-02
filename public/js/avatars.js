// ─── 8 Custom SVG Avatar Characters ───────────────────────────────────────────
// Each avatar is a unique character with distinct design and color scheme

const AVATARS = [
  {
    id: 'phantom',
    name: 'Phantom',
    color: '#7c3aed',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_ph" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#2d1b69"/>
          <stop offset="100%" stop-color="#0d0520"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_ph)"/>
      <!-- Hood -->
      <path d="M18 42 Q20 10 50 8 Q80 10 82 42 Q70 22 50 20 Q30 22 18 42Z" fill="#4c1d95"/>
      <path d="M12 52 Q18 42 18 42 Q25 28 50 25 Q75 28 82 42 Q82 42 88 52 Q82 65 82 100 L18 100 Q18 65 12 52Z" fill="#3b0764"/>
      <!-- Face -->
      <ellipse cx="50" cy="54" rx="23" ry="25" fill="#ede0d4"/>
      <!-- Domino mask -->
      <path d="M26 50 Q35 43 44 49 L44 55 Q35 61 26 54 Z" fill="#0d0520"/>
      <path d="M56 49 Q65 43 74 50 L74 54 Q65 61 56 55 Z" fill="#0d0520"/>
      <rect x="44" y="50" width="12" height="4" fill="#0d0520"/>
      <!-- Purple glowing eyes -->
      <ellipse cx="35" cy="52" rx="5.5" ry="4" fill="#7c3aed"/>
      <ellipse cx="65" cy="52" rx="5.5" ry="4" fill="#7c3aed"/>
      <circle cx="35" cy="52" r="2.5" fill="#c4b5fd"/>
      <circle cx="65" cy="52" r="2.5" fill="#c4b5fd"/>
      <circle cx="36" cy="51" r="1" fill="white" opacity="0.9"/>
      <circle cx="66" cy="51" r="1" fill="white" opacity="0.9"/>
      <!-- Nose -->
      <path d="M47 62 Q50 65 53 62" stroke="#b89880" stroke-width="1.2" fill="none"/>
      <!-- Subtle smile -->
      <path d="M41 70 Q50 76 59 70" stroke="#a08060" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- Hood shadow rim -->
      <path d="M27 35 Q50 22 73 35 Q65 27 50 25 Q35 27 27 35Z" fill="#2e1065" opacity="0.5"/>
      <!-- Collar -->
      <path d="M30 77 Q50 85 70 77 L75 100 L25 100Z" fill="#4c1d95"/>
    </svg>`
  },
  {
    id: 'blaze',
    name: 'Blaze',
    color: '#ea580c',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_bl" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#7c1a0a"/>
          <stop offset="100%" stop-color="#1a0500"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_bl)"/>
      <!-- Flames / spiky hair -->
      <path d="M30 42 Q32 20 40 28 Q35 10 50 15 Q65 10 60 28 Q68 20 70 42" fill="#f97316"/>
      <path d="M34 42 Q36 25 43 31 Q40 18 50 22 Q60 18 57 31 Q64 25 66 42" fill="#fbbf24"/>
      <path d="M38 42 Q40 30 47 34 Q45 25 50 28 Q55 25 53 34 Q60 30 62 42" fill="#fde68a"/>
      <!-- Face -->
      <ellipse cx="50" cy="60" rx="22" ry="24" fill="#f5cba7"/>
      <!-- Eyebrows fierce -->
      <path d="M28 52 Q35 48 42 51" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M58 51 Q65 48 72 52" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Eyes -->
      <ellipse cx="36" cy="57" rx="5.5" ry="5" fill="white"/>
      <ellipse cx="64" cy="57" rx="5.5" ry="5" fill="white"/>
      <circle cx="37" cy="57" r="3.5" fill="#c2410c"/>
      <circle cx="65" cy="57" r="3.5" fill="#c2410c"/>
      <circle cx="37" cy="57" r="2" fill="#1a0500"/>
      <circle cx="65" cy="57" r="2" fill="#1a0500"/>
      <circle cx="38" cy="56" r="0.8" fill="white"/>
      <circle cx="66" cy="56" r="0.8" fill="white"/>
      <!-- Flame mark on cheek -->
      <path d="M24 62 Q22 58 25 55 Q23 60 26 62Z" fill="#f97316" opacity="0.8"/>
      <!-- Nose -->
      <ellipse cx="50" cy="65" rx="3" ry="2" fill="#e5a882"/>
      <!-- Grin -->
      <path d="M38 73 Q44 78 50 78 Q56 78 62 73" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Teeth glimpse -->
      <path d="M43 74 Q50 77 57 74 Q50 80 43 74Z" fill="white" opacity="0.7"/>
      <!-- Neck/shoulders -->
      <path d="M28 82 Q50 92 72 82 L78 100 L22 100Z" fill="#7c1a0a"/>
    </svg>`
  },
  {
    id: 'glacier',
    name: 'Glacier',
    color: '#0ea5e9',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_gl" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#0c2a4a"/>
          <stop offset="100%" stop-color="#030d1a"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_gl)"/>
      <!-- Ice crystal crown -->
      <polygon points="50,5 54,18 62,12 58,22 68,18 62,28 72,26 65,34" fill="#bae6fd" opacity="0.9"/>
      <polygon points="50,5 46,18 38,12 42,22 32,18 38,28 28,26 35,34" fill="#bae6fd" opacity="0.9"/>
      <polygon points="50,5 50,32" stroke="#e0f2fe" stroke-width="1" fill="none"/>
      <!-- Flowing hair sides -->
      <path d="M22 40 Q15 55 18 72 Q22 55 28 48Z" fill="#e0f2fe"/>
      <path d="M78 40 Q85 55 82 72 Q78 55 72 48Z" fill="#e0f2fe"/>
      <!-- Face -->
      <ellipse cx="50" cy="58" rx="25" ry="26" fill="#dbeafe"/>
      <!-- Ice blue tint overlay -->
      <ellipse cx="50" cy="52" rx="25" ry="20" fill="#eff6ff" opacity="0.4"/>
      <!-- Eyes -->
      <ellipse cx="36" cy="54" rx="6" ry="6.5" fill="white"/>
      <ellipse cx="64" cy="54" rx="6" ry="6.5" fill="white"/>
      <circle cx="37" cy="55" r="4" fill="#0284c7"/>
      <circle cx="65" cy="55" r="4" fill="#0284c7"/>
      <circle cx="37" cy="55" r="2" fill="#082f49"/>
      <circle cx="65" cy="55" r="2" fill="#082f49"/>
      <circle cx="38.5" cy="53.5" r="1" fill="white"/>
      <circle cx="66.5" cy="53.5" r="1" fill="white"/>
      <!-- Eyelashes top -->
      <path d="M30 50 Q36 46 42 50" stroke="#0c4a6e" stroke-width="1" fill="none"/>
      <path d="M58 50 Q64 46 70 50" stroke="#0c4a6e" stroke-width="1" fill="none"/>
      <!-- Ice crystal on forehead -->
      <polygon points="50,36 53,42 50,45 47,42" fill="#7dd3fc" opacity="0.8"/>
      <!-- Nose -->
      <path d="M47 63 Q50 66 53 63" stroke="#93c5fd" stroke-width="1.2" fill="none"/>
      <!-- Serene lips -->
      <path d="M41 72 Q50 77 59 72" stroke="#7dd3fc" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M44 72 Q50 75 56 72" fill="#bae6fd" opacity="0.5"/>
      <!-- Robe/collar -->
      <path d="M25 82 Q50 90 75 82 L82 100 L18 100Z" fill="#0c4a6e"/>
      <!-- Snowflake detail on robe -->
      <circle cx="50" cy="92" r="3" fill="none" stroke="#7dd3fc" stroke-width="1"/>
      <line x1="50" y1="89" x2="50" y2="95" stroke="#7dd3fc" stroke-width="1"/>
      <line x1="47" y1="92" x2="53" y2="92" stroke="#7dd3fc" stroke-width="1"/>
    </svg>`
  },
  {
    id: 'shadow',
    name: 'Shadow',
    color: '#374151',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_sh" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#111827"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_sh)"/>
      <!-- Ninja headband/wrap -->
      <path d="M15 42 Q18 28 50 24 Q82 28 85 42 Q80 32 50 30 Q20 32 15 42Z" fill="#1f2937"/>
      <rect x="15" y="42" width="70" height="8" fill="#111827"/>
      <!-- Headband knot/tails -->
      <path d="M75 46 L88 38 L86 44 L92 42 L85 52Z" fill="#1f2937"/>
      <!-- Face with mask (lower half covered) -->
      <ellipse cx="50" cy="60" rx="24" ry="26" fill="#374151"/>
      <!-- Skin - forehead only -->
      <ellipse cx="50" cy="50" rx="22" ry="12" fill="#d4a574"/>
      <!-- Mask covering lower face -->
      <rect x="26" y="58" width="48" height="30" rx="6" fill="#1f2937"/>
      <!-- Eyes - sharp and visible -->
      <ellipse cx="35" cy="52" rx="7" ry="5.5" fill="white"/>
      <ellipse cx="65" cy="52" rx="7" ry="5.5" fill="white"/>
      <circle cx="37" cy="52" r="4" fill="#4b5563"/>
      <circle cx="67" cy="52" r="4" fill="#4b5563"/>
      <circle cx="37" cy="52" r="2.5" fill="#030712"/>
      <circle cx="67" cy="52" r="2.5" fill="#030712"/>
      <!-- Narrowed / focused eyes -->
      <rect x="28" y="50" width="14" height="2" rx="1" fill="#d4a574" opacity="0.5"/>
      <rect x="58" y="50" width="14" height="2" rx="1" fill="#d4a574" opacity="0.5"/>
      <circle cx="38.5" cy="51" r="0.8" fill="white"/>
      <circle cx="68.5" cy="51" r="0.8" fill="white"/>
      <!-- Mask crease lines -->
      <line x1="32" y1="64" x2="68" y2="64" stroke="#374151" stroke-width="1" opacity="0.6"/>
      <line x1="32" y1="70" x2="68" y2="70" stroke="#374151" stroke-width="1" opacity="0.4"/>
      <!-- Shoulders/uniform -->
      <path d="M20 80 Q50 92 80 80 L88 100 L12 100Z" fill="#111827"/>
      <!-- Sash/belt detail -->
      <path d="M35 84 Q50 88 65 84" stroke="#4b5563" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    id: 'viper',
    name: 'Viper',
    color: '#16a34a',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_vi" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#052e16"/>
          <stop offset="100%" stop-color="#01100a"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_vi)"/>
      <!-- Hood/scales at top -->
      <path d="M22 42 Q25 15 50 12 Q75 15 78 42" fill="#15803d" stroke="#166534" stroke-width="1"/>
      <!-- Scale pattern on hood -->
      <ellipse cx="50" cy="20" rx="8" ry="5" fill="#16a34a" opacity="0.5"/>
      <ellipse cx="38" cy="27" rx="6" ry="4" fill="#16a34a" opacity="0.5"/>
      <ellipse cx="62" cy="27" rx="6" ry="4" fill="#16a34a" opacity="0.5"/>
      <ellipse cx="30" cy="35" rx="5" ry="3" fill="#16a34a" opacity="0.4"/>
      <ellipse cx="70" cy="35" rx="5" ry="3" fill="#16a34a" opacity="0.4"/>
      <!-- Face - scaled green -->
      <ellipse cx="50" cy="58" rx="24" ry="25" fill="#4ade80"/>
      <!-- Scale texture on face -->
      <ellipse cx="50" cy="52" rx="10" ry="7" fill="#22c55e" opacity="0.4"/>
      <ellipse cx="33" cy="58" rx="6" ry="5" fill="#22c55e" opacity="0.3"/>
      <ellipse cx="67" cy="58" rx="6" ry="5" fill="#22c55e" opacity="0.3"/>
      <!-- Slit eyes - yellow -->
      <ellipse cx="36" cy="52" rx="7" ry="6" fill="#fef08a"/>
      <ellipse cx="64" cy="52" rx="7" ry="6" fill="#fef08a"/>
      <!-- Vertical slit pupils -->
      <rect x="34.5" y="46" width="3" height="12" rx="1.5" fill="#052e16"/>
      <rect x="62.5" y="46" width="3" height="12" rx="1.5" fill="#052e16"/>
      <circle cx="36" cy="52" r="1" fill="#fbbf24" opacity="0.6"/>
      <circle cx="64" cy="52" r="1" fill="#fbbf24" opacity="0.6"/>
      <!-- Nose slits -->
      <path d="M47 63 L48 66 M53 66 L54 63" stroke="#15803d" stroke-width="1.5" fill="none"/>
      <!-- Forked tongue -->
      <path d="M50 74 L50 80 M50 80 L46 85 M50 80 L54 85" stroke="#dc2626" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- Neck/body -->
      <path d="M26 80 Q50 92 74 80 L80 100 L20 100Z" fill="#15803d"/>
    </svg>`
  },
  {
    id: 'thunder',
    name: 'Thunder',
    color: '#ca8a04',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_th" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#3d2800"/>
          <stop offset="100%" stop-color="#1a1000"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_th)"/>
      <!-- Electric spiky hair -->
      <path d="M22 42 L28 22 L34 35 L40 15 L46 30 L50 12 L54 30 L60 15 L66 35 L72 22 L78 42" fill="#fbbf24"/>
      <path d="M26 42 L31 26 L37 37 L43 20 L48 32 L50 18 L52 32 L57 20 L63 37 L69 26 L74 42" fill="#fde68a"/>
      <!-- Electric arcs in hair -->
      <path d="M32 32 L36 26 L40 33" stroke="#fef3c7" stroke-width="0.8" fill="none" opacity="0.8"/>
      <path d="M62 28 L66 22 L70 30" stroke="#fef3c7" stroke-width="0.8" fill="none" opacity="0.8"/>
      <!-- Face -->
      <ellipse cx="50" cy="60" rx="23" ry="24" fill="#fde68a"/>
      <!-- Lightning bolt mark on forehead -->
      <path d="M48 40 L52 48 L48 48 L52 56" stroke="#d97706" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Eyebrows - determined -->
      <path d="M28 52 Q35 48 42 52" stroke="#92400e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M58 52 Q65 48 72 52" stroke="#92400e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Eyes - energetic -->
      <ellipse cx="35" cy="57" rx="6" ry="6" fill="white"/>
      <ellipse cx="65" cy="57" rx="6" ry="6" fill="white"/>
      <circle cx="36" cy="57" r="4" fill="#d97706"/>
      <circle cx="66" cy="57" r="4" fill="#d97706"/>
      <circle cx="36" cy="57" r="2" fill="#1c0a00"/>
      <circle cx="66" cy="57" r="2" fill="#1c0a00"/>
      <circle cx="37.5" cy="55.5" r="1" fill="white"/>
      <circle cx="67.5" cy="55.5" r="1" fill="white"/>
      <!-- Small electric sparks near eyes -->
      <path d="M27 54 L24 52 L28 51" stroke="#fbbf24" stroke-width="0.8" fill="none"/>
      <path d="M73 54 L76 52 L72 51" stroke="#fbbf24" stroke-width="0.8" fill="none"/>
      <!-- Nose -->
      <ellipse cx="50" cy="65" rx="3" ry="2" fill="#e5b97a"/>
      <!-- Wide grin -->
      <path d="M37 72 Q43 79 50 80 Q57 79 63 72" stroke="#92400e" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M41 73 Q50 80 59 73 Q50 82 41 73Z" fill="white" opacity="0.8"/>
      <!-- Shoulders/armor -->
      <path d="M22 80 Q50 92 78 80 L85 100 L15 100Z" fill="#92400e"/>
      <path d="M37 83 L44 87 M56 87 L63 83" stroke="#fbbf24" stroke-width="1.5" fill="none"/>
    </svg>`
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    color: '#4f46e5',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_co" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#0a0520"/>
          <stop offset="100%" stop-color="#01000a"/>
        </radialGradient>
        <radialGradient id="face_co" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#312e81"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_co)"/>
      <!-- Stars background -->
      <circle cx="20" cy="15" r="1" fill="white" opacity="0.8"/>
      <circle cx="75" cy="10" r="0.8" fill="white" opacity="0.7"/>
      <circle cx="85" cy="30" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="15" cy="35" r="0.9" fill="white" opacity="0.6"/>
      <circle cx="80" cy="72" r="1" fill="white" opacity="0.8"/>
      <circle cx="18" cy="68" r="0.8" fill="white" opacity="0.7"/>
      <circle cx="88" cy="55" r="0.6" fill="white" opacity="0.5"/>
      <!-- Cosmic swirl halo -->
      <circle cx="50" cy="42" r="26" fill="none" stroke="#6366f1" stroke-width="1" opacity="0.4" stroke-dasharray="4 6"/>
      <circle cx="50" cy="42" r="20" fill="none" stroke="#818cf8" stroke-width="0.8" opacity="0.3" stroke-dasharray="3 8"/>
      <!-- Face -->
      <ellipse cx="50" cy="57" rx="24" ry="26" fill="url(#face_co)"/>
      <!-- Star/galaxy pattern on face -->
      <circle cx="35" cy="52" r="1" fill="#a5b4fc" opacity="0.7"/>
      <circle cx="65" cy="52" r="1" fill="#a5b4fc" opacity="0.7"/>
      <circle cx="44" cy="65" r="0.8" fill="#818cf8" opacity="0.6"/>
      <circle cx="56" cy="65" r="0.8" fill="#818cf8" opacity="0.6"/>
      <circle cx="50" cy="72" r="0.6" fill="#6366f1" opacity="0.5"/>
      <!-- Glowing white eyes -->
      <ellipse cx="36" cy="54" rx="7" ry="6.5" fill="white" opacity="0.95"/>
      <ellipse cx="64" cy="54" rx="7" ry="6.5" fill="white" opacity="0.95"/>
      <!-- Iris - cosmic -->
      <circle cx="37" cy="54" r="4.5" fill="#6366f1"/>
      <circle cx="65" cy="54" r="4.5" fill="#6366f1"/>
      <!-- Pupil -->
      <circle cx="37" cy="54" r="2.5" fill="#0a0520"/>
      <circle cx="65" cy="54" r="2.5" fill="#0a0520"/>
      <!-- Star in pupil -->
      <circle cx="37" cy="54" r="0.8" fill="white"/>
      <circle cx="65" cy="54" r="0.8" fill="white"/>
      <!-- Glow rings -->
      <circle cx="37" cy="54" r="5.5" fill="none" stroke="#818cf8" stroke-width="0.5" opacity="0.6"/>
      <circle cx="65" cy="54" r="5.5" fill="none" stroke="#818cf8" stroke-width="0.5" opacity="0.6"/>
      <!-- Nose -->
      <path d="M47 64 Q50 67 53 64" stroke="#6366f1" stroke-width="1.2" fill="none"/>
      <!-- Ethereal lips -->
      <path d="M40 73 Q50 78 60 73" stroke="#818cf8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <!-- Cosmic robes -->
      <path d="M22 82 Q50 95 78 82 L85 100 L15 100Z" fill="#1e1b4b"/>
      <!-- Constellation on robe -->
      <circle cx="38" cy="92" r="0.8" fill="#a5b4fc"/>
      <circle cx="50" cy="89" r="0.8" fill="#a5b4fc"/>
      <circle cx="62" cy="92" r="0.8" fill="#a5b4fc"/>
      <line x1="38" y1="92" x2="50" y2="89" stroke="#6366f1" stroke-width="0.5" opacity="0.6"/>
      <line x1="50" y1="89" x2="62" y2="92" stroke="#6366f1" stroke-width="0.5" opacity="0.6"/>
    </svg>`
  },
  {
    id: 'titan',
    name: 'Titan',
    color: '#b45309',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_ti" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#292008"/>
          <stop offset="100%" stop-color="#0d0800"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg_ti)"/>
      <!-- Gladiator helmet -->
      <rect x="22" y="22" width="56" height="28" rx="8" fill="#78350f"/>
      <rect x="22" y="22" width="56" height="8" rx="8" fill="#d97706"/>
      <!-- Helmet crest/plume -->
      <path d="M45 8 Q50 2 55 8 L57 22 L43 22 Z" fill="#dc2626"/>
      <path d="M48 12 Q50 6 52 12 L54 22 L46 22 Z" fill="#ef4444"/>
      <!-- Helmet visor -->
      <rect x="26" y="35" width="48" height="12" rx="4" fill="#451a03"/>
      <!-- Helmet cheek guards -->
      <rect x="22" y="30" width="12" height="22" rx="3" fill="#78350f"/>
      <rect x="66" y="30" width="12" height="22" rx="3" fill="#78350f"/>
      <!-- Face visible under visor -->
      <ellipse cx="50" cy="62" rx="22" ry="20" fill="#d4a574"/>
      <!-- Strong jaw -->
      <path d="M28 68 Q50 82 72 68 Q65 78 50 82 Q35 78 28 68Z" fill="#c4956a"/>
      <!-- Eyes - commanding -->
      <ellipse cx="37" cy="52" rx="6" ry="5" fill="white"/>
      <ellipse cx="63" cy="52" rx="6" ry="5" fill="white"/>
      <circle cx="38" cy="52" r="4" fill="#92400e"/>
      <circle cx="64" cy="52" r="4" fill="#92400e"/>
      <circle cx="38" cy="52" r="2.2" fill="#1c0a00"/>
      <circle cx="64" cy="52" r="2.2" fill="#1c0a00"/>
      <circle cx="39" cy="51" r="0.8" fill="white"/>
      <circle cx="65" cy="51" r="0.8" fill="white"/>
      <!-- Bushy brows -->
      <path d="M30 48 Q37 44 44 47" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M56 47 Q63 44 70 48" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Nose - strong -->
      <path d="M47 60 L47 66 Q50 68 53 66 L53 60" stroke="#c4956a" stroke-width="1" fill="#c4956a" opacity="0.4"/>
      <!-- Jaw set, stern mouth -->
      <path d="M40 73 Q50 77 60 73" stroke="#92400e" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Armor shoulder pads -->
      <path d="M15 84 Q30 76 30 90 L15 100Z" fill="#78350f"/>
      <path d="M85 84 Q70 76 70 90 L85 100Z" fill="#78350f"/>
      <path d="M15 84 Q50 96 85 84 L88 100 L12 100Z" fill="#451a03"/>
      <!-- Gold armor trim -->
      <path d="M15 84 Q50 92 85 84" stroke="#d97706" stroke-width="2" fill="none"/>
    </svg>`
  }
];

// Make available globally
if (typeof module !== 'undefined') {
  module.exports = AVATARS;
}
