// Transparent background fun stickers library
// Encoded as high-res scalable SVGs with transparent backgrounds

export const STICKER_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'funny', name: 'Funny & Disguise' },
  { id: 'censor', name: 'Privacy Censor' },
  { id: 'cute', name: 'Cute & Bows' },
  { id: 'emoji', name: 'Emojis' }
];

export const STICKERS = [
  // --- FUNNY & DISGUISE ---
  {
    id: 'groucho',
    name: 'Disguise Glasses',
    category: 'funny',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">
      <!-- Eyebrows -->
      <path d="M 25 35 Q 55 15 85 30" stroke="#1c1917" stroke-width="14" stroke-linecap="round" fill="none"/>
      <path d="M 115 30 Q 145 15 175 35" stroke="#1c1917" stroke-width="14" stroke-linecap="round" fill="none"/>
      <!-- Glasses Frame -->
      <circle cx="55" cy="55" r="28" fill="none" stroke="#09090b" stroke-width="8"/>
      <circle cx="145" cy="55" r="28" fill="none" stroke="#09090b" stroke-width="8"/>
      <path d="M 83 55 Q 100 48 117 55" fill="none" stroke="#09090b" stroke-width="8" stroke-linecap="round"/>
      <!-- Big Nose -->
      <path d="M 88 56 C 80 85 70 108 90 115 C 100 118 105 118 110 115 C 130 108 120 85 112 56 Z" fill="#fca5a5" stroke="#ef4444" stroke-width="3"/>
      <!-- Nostrils -->
      <circle cx="86" cy="110" r="4" fill="#b91c1c"/>
      <circle cx="114" cy="110" r="4" fill="#b91c1c"/>
      <!-- Bushy Mustache -->
      <path d="M 100 112 C 85 96 45 102 20 128 C 45 140 85 124 100 120 C 115 124 155 140 180 128 C 155 102 115 96 100 112 Z" fill="#1c1917"/>
    </svg>`
  },
  {
    id: 'thug-life',
    name: 'Pixel Shades',
    category: 'funny',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 70">
      <!-- 8-Bit Pixel Sunglasses -->
      <path d="M 10 15 H 210 V 27 H 198 V 39 H 126 V 27 H 94 V 39 H 22 V 27 H 10 Z" fill="#000000"/>
      <!-- Pixel Glare on Left Lens -->
      <rect x="22" y="19" width="10" height="8" fill="#ffffff"/>
      <rect x="42" y="19" width="10" height="8" fill="#ffffff"/>
      <rect x="32" y="27" width="10" height="8" fill="#ffffff"/>
      <!-- Pixel Glare on Right Lens -->
      <rect x="136" y="19" width="10" height="8" fill="#ffffff"/>
      <rect x="156" y="19" width="10" height="8" fill="#ffffff"/>
      <rect x="146" y="27" width="10" height="8" fill="#ffffff"/>
      <!-- Hanging Cigarette / Joint -->
      <rect x="160" y="44" width="45" height="10" fill="#f8fafc" stroke="#334155" stroke-width="1.5" transform="rotate(18, 160, 44)"/>
      <rect x="195" y="44" width="10" height="10" fill="#ea580c" transform="rotate(18, 160, 44)"/>
      <circle cx="204" cy="58" r="3" fill="#94a3b8" opacity="0.6"/>
      <circle cx="208" cy="50" r="5" fill="#94a3b8" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'handlebar-mustache',
    name: 'Gentleman Mustache',
    category: 'funny',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90">
      <path d="M 100 45 C 80 20 40 18 10 38 C 5 42 12 50 18 45 C 40 32 68 38 85 52 C 94 60 97 65 100 70 C 103 65 106 60 115 52 C 132 38 160 32 182 45 C 188 50 195 42 190 38 C 160 18 120 20 100 45 Z" fill="#291e17" stroke="#17120e" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'clown-nose',
    name: 'Clown Nose & Smile',
    category: 'funny',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140">
      <!-- Red Clown Nose with highlight -->
      <circle cx="80" cy="50" r="34" fill="#dc2626"/>
      <ellipse cx="70" cy="40" rx="10" ry="7" fill="#fca5a5" transform="rotate(-30 70 40)"/>
      <!-- Giant Clown Smile -->
      <path d="M 25 80 Q 80 150 135 80 Q 80 115 25 80 Z" fill="#ffffff" stroke="#ef4444" stroke-width="8"/>
      <path d="M 80 92 V 125" stroke="#ef4444" stroke-width="3"/>
      <path d="M 60 90 V 120" stroke="#ef4444" stroke-width="3"/>
      <path d="M 100 90 V 120" stroke="#ef4444" stroke-width="3"/>
    </svg>`
  },
  {
    id: 'cat-ears-whiskers',
    name: 'Kawaii Cat Face',
    category: 'funny',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">
      <!-- Ears -->
      <polygon points="30,80 10,20 70,45" fill="#f43f5e" stroke="#000" stroke-width="4"/>
      <polygon points="33,70 20,32 60,48" fill="#fda4af"/>
      <polygon points="170,80 190,20 130,45" fill="#f43f5e" stroke="#000" stroke-width="4"/>
      <polygon points="167,70 180,32 140,48" fill="#fda4af"/>
      <!-- Heart Nose -->
      <path d="M 100 90 C 95 82 85 82 85 90 C 85 98 100 108 100 108 C 100 108 115 98 115 90 C 115 82 105 82 100 90 Z" fill="#f43f5e"/>
      <!-- Mouth -->
      <path d="M 100 108 Q 90 120 80 115" stroke="#000" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M 100 108 Q 110 120 120 115" stroke="#000" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- Whiskers -->
      <line x1="20" y1="95" x2="70" y2="102" stroke="#000" stroke-width="4" stroke-linecap="round"/>
      <line x1="15" y1="115" x2="68" y2="114" stroke="#000" stroke-width="4" stroke-linecap="round"/>
      <line x1="180" y1="95" x2="130" y2="102" stroke="#000" stroke-width="4" stroke-linecap="round"/>
      <line x1="185" y1="115" x2="132" y2="114" stroke="#000" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'star-shades',
    name: 'Star Sunglasses',
    category: 'funny',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 100">
      <!-- Bridge -->
      <path d="M 85 50 Q 110 40 135 50" stroke="#f59e0b" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Left Star -->
      <polygon points="60,10 73,38 103,42 80,63 86,93 60,78 34,93 40,63 17,42 47,38" fill="#fef08a" stroke="#d97706" stroke-width="6"/>
      <polygon points="60,25 68,43 88,46 73,60 77,80 60,70 43,80 47,60 32,46 52,43" fill="#0284c7" opacity="0.85"/>
      <!-- Right Star -->
      <polygon points="160,10 173,38 203,42 180,63 186,93 160,78 134,93 140,63 117,42 147,38" fill="#fef08a" stroke="#d97706" stroke-width="6"/>
      <polygon points="160,25 168,43 188,46 173,60 177,80 160,70 143,80 147,60 132,46 152,43" fill="#0284c7" opacity="0.85"/>
    </svg>`
  },

  // --- CENSOR & PRIVACY ---
  {
    id: 'censored-bar',
    name: 'CENSORED Bar',
    category: 'censor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60">
      <rect x="4" y="4" width="232" height="52" rx="4" fill="#09090b" stroke="#ffffff" stroke-width="3"/>
      <text x="120" y="38" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="4">CENSORED</text>
    </svg>`
  },
  {
    id: 'top-secret',
    name: 'TOP SECRET Stamp',
    category: 'censor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 80">
      <rect x="8" y="8" width="204" height="64" rx="8" fill="none" stroke="#dc2626" stroke-width="6" stroke-dasharray="190, 8"/>
      <text x="110" y="42" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="26" fill="#dc2626" text-anchor="middle" letter-spacing="2">TOP SECRET</text>
      <text x="110" y="60" font-family="monospace" font-size="12" font-weight="700" fill="#dc2626" text-anchor="middle" letter-spacing="1">CONFIDENTIAL</text>
    </svg>`
  },
  {
    id: 'redacted-tag',
    name: 'REDACTED Stamp',
    category: 'censor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
      <rect x="5" y="5" width="190" height="50" fill="#000000"/>
      <rect x="9" y="9" width="182" height="42" fill="none" stroke="#ef4444" stroke-width="2"/>
      <text x="100" y="38" font-family="Impact, sans-serif" font-size="24" fill="#ef4444" text-anchor="middle" letter-spacing="3">REDACTED</text>
    </svg>`
  },
  {
    id: 'pixel-eye-bar',
    name: 'Pixel Mosaic Bar',
    category: 'censor',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50">
      <!-- Mosaic Blocks -->
      <rect x="0" y="0" width="25" height="25" fill="#334155"/>
      <rect x="25" y="0" width="25" height="25" fill="#64748b"/>
      <rect x="50" y="0" width="25" height="25" fill="#1e293b"/>
      <rect x="75" y="0" width="25" height="25" fill="#475569"/>
      <rect x="100" y="0" width="25" height="25" fill="#334155"/>
      <rect x="125" y="0" width="25" height="25" fill="#0f172a"/>
      <rect x="150" y="0" width="25" height="25" fill="#64748b"/>
      <rect x="175" y="0" width="25" height="25" fill="#1e293b"/>
      <rect x="0" y="25" width="25" height="25" fill="#1e293b"/>
      <rect x="25" y="25" width="25" height="25" fill="#475569"/>
      <rect x="50" y="25" width="25" height="25" fill="#334155"/>
      <rect x="75" y="25" width="25" height="25" fill="#0f172a"/>
      <rect x="100" y="25" width="25" height="25" fill="#64748b"/>
      <rect x="125" y="25" width="25" height="25" fill="#334155"/>
      <rect x="150" y="25" width="25" height="25" fill="#1e293b"/>
      <rect x="175" y="25" width="25" height="25" fill="#475569"/>
    </svg>`
  },

  // --- CUTE & BOWS (From Screenshot 5) ---
  {
    id: 'yellow-ribbon-bow',
    name: 'Yellow Ribbon Bow',
    category: 'cute',
    // Exact cute yellow 3D ribbon bow from Screenshot 5
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">
      <defs>
        <radialGradient id="bowGold" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fff066"/>
          <stop offset="50%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#a16207"/>
        </radialGradient>
        <linearGradient id="ribbonTail" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#854d0e"/>
        </linearGradient>
      </defs>
      <!-- Left Ribbon Tail -->
      <path d="M 90 85 L 60 150 L 80 135 L 105 148 L 98 85 Z" fill="url(#ribbonTail)" stroke="#713f12" stroke-width="2"/>
      <!-- Right Ribbon Tail -->
      <path d="M 110 85 L 140 150 L 120 135 L 95 148 L 102 85 Z" fill="url(#ribbonTail)" stroke="#713f12" stroke-width="2"/>
      <!-- Left Loop -->
      <path d="M 95 75 C 60 40 10 35 15 75 C 20 105 70 95 95 80 Z" fill="url(#bowGold)" stroke="#854d0e" stroke-width="3"/>
      <!-- Left Inner Fold -->
      <path d="M 90 77 C 65 58 35 55 40 75 C 45 90 70 85 90 80 Z" fill="#854d0e" opacity="0.4"/>
      <!-- Right Loop -->
      <path d="M 105 75 C 140 40 190 35 185 75 C 180 105 130 95 105 80 Z" fill="url(#bowGold)" stroke="#854d0e" stroke-width="3"/>
      <!-- Right Inner Fold -->
      <path d="M 110 77 C 135 58 165 55 160 75 C 155 90 130 85 110 80 Z" fill="#854d0e" opacity="0.4"/>
      <!-- Center Knot -->
      <ellipse cx="100" cy="78" rx="16" ry="14" fill="url(#bowGold)" stroke="#713f12" stroke-width="3"/>
      <path d="M 95 68 C 98 75 98 81 95 88" stroke="#ca8a04" stroke-width="2" fill="none"/>
      <path d="M 105 68 C 102 75 102 81 105 88" stroke="#713f12" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    id: 'gold-crown',
    name: 'Royal Crown',
    category: 'cute',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140">
      <defs>
        <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <!-- Crown Base & Spikes -->
      <path d="M 25 110 L 20 45 L 65 75 L 100 25 L 135 75 L 180 45 L 175 110 Z" fill="url(#crownGrad)" stroke="#78350f" stroke-width="5"/>
      <!-- Pearls on top of spikes -->
      <circle cx="20" cy="40" r="10" fill="#ffffff" stroke="#eab308" stroke-width="2"/>
      <circle cx="65" cy="72" r="8" fill="#ffffff" stroke="#eab308" stroke-width="2"/>
      <circle cx="100" cy="20" r="12" fill="#ef4444" stroke="#eab308" stroke-width="2"/>
      <circle cx="135" cy="72" r="8" fill="#ffffff" stroke="#eab308" stroke-width="2"/>
      <circle cx="180" cy="40" r="10" fill="#ffffff" stroke="#eab308" stroke-width="2"/>
      <!-- Jewels along rim -->
      <circle cx="55" cy="98" r="7" fill="#3b82f6"/>
      <circle cx="100" cy="98" r="9" fill="#10b981"/>
      <circle cx="145" cy="98" r="7" fill="#ec4899"/>
      <!-- Sparkling rays -->
      <path d="M 100 0 L 100 8 M 96 4 L 104 4" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'blush-cheeks',
    name: 'Blush Cheeks',
    category: 'cute',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
      <ellipse cx="40" cy="30" rx="28" ry="16" fill="#f43f5e" opacity="0.6"/>
      <path d="M 28 24 L 33 36 M 38 24 L 43 36 M 48 24 L 53 36" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="160" cy="30" rx="28" ry="16" fill="#f43f5e" opacity="0.6"/>
      <path d="M 148 24 L 153 36 M 158 24 L 163 36 M 168 24 L 173 36" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'angel-halo',
    name: 'Golden Angel Halo',
    category: 'cute',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
      <ellipse cx="100" cy="40" rx="85" ry="24" fill="none" stroke="#fef08a" stroke-width="14" opacity="0.6"/>
      <ellipse cx="100" cy="40" rx="85" ry="24" fill="none" stroke="#eab308" stroke-width="8"/>
      <ellipse cx="100" cy="38" rx="80" ry="20" fill="none" stroke="#ffffff" stroke-width="3"/>
    </svg>`
  },
  {
    id: 'neon-heart',
    name: 'Sparkle Heart',
    category: 'cute',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140">
      <path d="M 80 40 C 65 10 20 15 20 55 C 20 90 70 115 80 125 C 90 115 140 90 140 55 C 140 15 95 10 80 40 Z" fill="#ec4899" stroke="#db2777" stroke-width="4"/>
      <!-- Sparkles -->
      <path d="M 40 35 Q 40 45 45 45 Q 40 45 40 55 Q 40 45 35 45 Q 40 45 40 35 Z" fill="#ffffff"/>
      <circle cx="120" cy="35" r="4" fill="#ffffff"/>
      <circle cx="132" cy="48" r="2.5" fill="#ffffff"/>
    </svg>`
  },

  // --- EMOJIS ---
  {
    id: 'emoji-laugh',
    name: 'Laughing Emoji',
    category: 'emoji',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="60" fill="#facc15" stroke="#ca8a04" stroke-width="4"/>
      <!-- Squeezed eyes -->
      <path d="M 32 50 L 52 58 L 32 66" fill="none" stroke="#713f12" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 108 50 L 88 58 L 108 66" fill="none" stroke="#713f12" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Open Laughing Mouth -->
      <path d="M 38 75 Q 70 125 102 75 Z" fill="#713f12"/>
      <path d="M 44 75 Q 70 82 96 75 Q 70 115 44 75 Z" fill="#dc2626"/>
      <path d="M 44 75 Q 70 80 96 75" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
      <!-- Tear drops -->
      <path d="M 22 62 C 12 75 12 85 24 85 C 34 85 34 75 22 62 Z" fill="#38bdf8"/>
      <path d="M 118 62 C 128 75 128 85 116 85 C 106 85 106 75 118 62 Z" fill="#38bdf8"/>
    </svg>`
  },
  {
    id: 'emoji-nerd',
    name: 'Nerd Emoji',
    category: 'emoji',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="60" fill="#facc15" stroke="#ca8a04" stroke-width="4"/>
      <!-- Glasses -->
      <circle cx="46" cy="58" r="20" fill="#ffffff" stroke="#18181b" stroke-width="5"/>
      <circle cx="94" cy="58" r="20" fill="#ffffff" stroke="#18181b" stroke-width="5"/>
      <line x1="66" y1="58" x2="74" y2="58" stroke="#18181b" stroke-width="6"/>
      <line x1="26" y1="58" x2="16" y2="52" stroke="#18181b" stroke-width="5"/>
      <line x1="114" y1="58" x2="124" y2="52" stroke="#18181b" stroke-width="5"/>
      <!-- Eyes -->
      <circle cx="48" cy="58" r="6" fill="#18181b"/>
      <circle cx="92" cy="58" r="6" fill="#18181b"/>
      <!-- Smile with Buck Teeth -->
      <path d="M 45 92 Q 70 112 95 92" fill="none" stroke="#713f12" stroke-width="5" stroke-linecap="round"/>
      <rect x="62" y="93" width="7" height="9" fill="#ffffff" stroke="#713f12" stroke-width="2"/>
      <rect x="71" y="93" width="7" height="9" fill="#ffffff" stroke="#713f12" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'emoji-monkey',
    name: 'See-No-Evil Monkey',
    category: 'emoji',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">
      <!-- Ears -->
      <circle cx="22" cy="70" r="18" fill="#a16207"/>
      <circle cx="22" cy="70" r="11" fill="#fde68a"/>
      <circle cx="118" cy="70" r="18" fill="#a16207"/>
      <circle cx="118" cy="70" r="11" fill="#fde68a"/>
      <!-- Head -->
      <circle cx="70" cy="70" r="50" fill="#92400e"/>
      <ellipse cx="70" cy="84" rx="34" ry="24" fill="#fde68a"/>
      <!-- Nostrils and mouth -->
      <circle cx="66" cy="80" r="2.5" fill="#78350f"/>
      <circle cx="74" cy="80" r="2.5" fill="#78350f"/>
      <path d="M 60 92 Q 70 98 80 92" stroke="#78350f" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Hands covering eyes -->
      <ellipse cx="46" cy="58" rx="16" ry="14" fill="#d97706" stroke="#78350f" stroke-width="3"/>
      <ellipse cx="94" cy="58" rx="16" ry="14" fill="#d97706" stroke="#78350f" stroke-width="3"/>
      <!-- Little fingers -->
      <line x1="38" y1="52" x2="38" y2="64" stroke="#78350f" stroke-width="2"/>
      <line x1="46" y1="50" x2="46" y2="66" stroke="#78350f" stroke-width="2"/>
      <line x1="54" y1="52" x2="54" y2="64" stroke="#78350f" stroke-width="2"/>
      <line x1="86" y1="52" x2="86" y2="64" stroke="#78350f" stroke-width="2"/>
      <line x1="94" y1="50" x2="94" y2="66" stroke="#78350f" stroke-width="2"/>
      <line x1="102" y1="52" x2="102" y2="64" stroke="#78350f" stroke-width="2"/>
    </svg>`
  }
];

// Helper to convert SVG string to data URI
export function getStickerDataUrl(svgString) {
  const cleaned = svgString.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}
