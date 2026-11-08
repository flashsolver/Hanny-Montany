// High-quality procedural and SVG test images embedded as Data URLs for instant testing without external downloads

export const SAMPLE_IMAGES = [
  {
    id: 'realistic',
    name: 'Realistic Person Portrait',
    url: new URL('../images/realistic-person.jpg', import.meta.url).href
  },
  {
    id: 'portrait',
    name: 'Artistic Girl Portrait',
    url: createPortraitDataUrl()
  },
  {
    id: 'id-card',
    name: 'Credit Card / Document (Text)',
    url: createCardDataUrl()
  },
  {
    id: 'outdoor',
    name: 'Beach & Person (Object Remove)',
    url: createBeachDataUrl()
  }
];

function createPortraitDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');

  // Background: lush green garden bokeh
  const bgGrad = ctx.createLinearGradient(0, 0, 900, 1200);
  bgGrad.addColorStop(0, '#78a85c');
  bgGrad.addColorStop(0.5, '#4a7536');
  bgGrad.addColorStop(1, '#2f4f1d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 900, 1200);

  // Soft bokeh circles in background
  const bokehColors = ['rgba(255, 245, 180, 0.25)', 'rgba(210, 245, 160, 0.2)', 'rgba(255, 255, 255, 0.18)'];
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % 900;
    const y = (i * 137) % 1200;
    const r = 25 + (i * 19) % 85;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = bokehColors[i % bokehColors.length];
    ctx.fill();
  }

  // Shoulders & Dress (Summer lemon print dress)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(150, 1200);
  ctx.bezierCurveTo(200, 850, 300, 780, 450, 780);
  ctx.bezierCurveTo(600, 780, 700, 850, 750, 1200);
  ctx.closePath();
  ctx.fillStyle = '#fffdf0';
  ctx.fill();

  // Lemon dress pattern
  for (let lx = 200; lx < 720; lx += 90) {
    for (let ly = 820; ly < 1200; ly += 85) {
      ctx.beginPath();
      ctx.ellipse(lx + (ly % 30), ly, 22, 16, Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffcf26';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx + (ly % 30) - 10, ly - 10, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#689f38';
      ctx.fill();
    }
  }
  ctx.restore();

  // Neck
  ctx.beginPath();
  ctx.rect(390, 620, 120, 200);
  ctx.fillStyle = '#f0c2a2';
  ctx.fill();

  // Face
  ctx.beginPath();
  ctx.ellipse(450, 500, 190, 230, 0, 0, Math.PI * 2);
  const skinGrad = ctx.createRadialGradient(420, 460, 40, 450, 500, 240);
  skinGrad.addColorStop(0, '#fde6d5');
  skinGrad.addColorStop(0.7, '#f6c5a6');
  skinGrad.addColorStop(1, '#e39f78');
  ctx.fillStyle = skinGrad;
  ctx.fill();

  // Rosy cheeks
  ctx.beginPath();
  ctx.ellipse(340, 540, 45, 28, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(240, 120, 120, 0.35)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(560, 540, 45, 28, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(240, 120, 120, 0.35)';
  ctx.fill();

  // Eyes
  const drawEye = (x, y) => {
    ctx.beginPath();
    ctx.ellipse(x, y, 28, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#4a2f1b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#100c08';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Eyelash
    ctx.beginPath();
    ctx.arc(x, y - 4, 28, Math.PI * 1.15, Math.PI * 1.85);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2b1b11';
    ctx.stroke();
  };
  drawEye(360, 470);
  drawEye(540, 470);

  // Eyebrows
  ctx.beginPath();
  ctx.ellipse(360, 435, 32, 6, -0.1, 0, Math.PI * 2);
  ctx.ellipse(540, 435, 32, 6, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#8c5936';
  ctx.fill();

  // Cute nose
  ctx.beginPath();
  ctx.arc(450, 535, 12, 0.1, Math.PI * 0.9);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#d48a60';
  ctx.stroke();

  // Smile
  ctx.beginPath();
  ctx.arc(450, 595, 36, 0.2, Math.PI * 0.8);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#be4343';
  ctx.stroke();

  // Curly Blonde/Caramel Hair around face
  const hairColors = ['#d8a45e', '#f2cf85', '#be8942', '#edd091'];
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    const startX = 220 + (i * 27) % 460;
    const startY = 250 + (i * 11) % 180;
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX - 90 + ((i * 37) % 180), startY + 200,
      startX + 80 - ((i * 29) % 160), startY + 450,
      startX + ((i * 19) % 120) - 60, startY + 700
    );
    ctx.lineWidth = 14 + (i % 12);
    ctx.strokeStyle = hairColors[i % hairColors.length];
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

function createCardDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');

  // Background clean workspace
  ctx.fillStyle = '#f3f4f8';
  ctx.fillRect(0, 0, 1000, 1200);

  // Title
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Order Confirmation & Payment', 70, 90);
  ctx.font = '18px -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Please verify your billing details and confidential payment method below.', 70, 130);

  // Card Panel
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(70, 180, 860, 420, 20);
  ctx.fill();
  ctx.restore();

  // Card details header
  ctx.font = 'bold 24px -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Payment Method', 110, 235);

  // Credit Card Graphic inside panel
  const ccGrad = ctx.createLinearGradient(600, 220, 880, 390);
  ccGrad.addColorStop(0, '#2563eb');
  ccGrad.addColorStop(1, '#1e40af');
  ctx.fillStyle = ccGrad;
  ctx.beginPath();
  ctx.roundRect(620, 220, 270, 170, 16);
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.roundRect(650, 260, 42, 32, 6);
  ctx.fill();
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('•••• 8492', 650, 340);
  ctx.font = '12px sans-serif';
  ctx.fillText('VALID THRU 08/29', 650, 365);

  // Form fields
  const drawField = (label, value, y) => {
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(label, 110, y);
    ctx.font = '500 20px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(value, 110, y + 32);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(110, y + 46);
    ctx.lineTo(580, y + 46);
    ctx.stroke();
  };

  drawField('CARDHOLDER NAME', 'ALEXANDER D. MORGAN', 290);
  drawField('CARD NUMBER', '4532  8901  2384  8492', 370);
  drawField('EXPIRATION DATE & CVV', '08 / 29       CVV: 924', 450);

  // Billing address panel
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(70, 640, 860, 480, 20);
  ctx.fill();
  ctx.restore();

  ctx.font = 'bold 24px -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Billing & Delivery Address', 110, 695);

  drawField('FULL NAME', 'ALEXANDER MORGAN', 750);
  drawField('STREET ADDRESS', '742 EVERGREEN TERRACE, APT 4B', 830);
  drawField('CITY, STATE, ZIP', 'SPRINGFIELD, OR  97477', 910);
  drawField('PHONE NUMBER', '+1 (555) 019-2834', 990);
  drawField('EMAIL ADDRESS', 'alex.morgan.confidential@gmail.com', 1060);

  return canvas.toDataURL('image/jpeg', 0.92);
}

function createBeachDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');

  // Pale dreamy sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 750);
  skyGrad.addColorStop(0, '#f0f5fa');
  skyGrad.addColorStop(0.7, '#d8e5f2');
  skyGrad.addColorStop(1, '#b5cde3');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 900, 750);

  // Horizon & Calm Sea
  const seaGrad = ctx.createLinearGradient(0, 750, 0, 950);
  seaGrad.addColorStop(0, '#92b6cf');
  seaGrad.addColorStop(0.5, '#759dbd');
  seaGrad.addColorStop(1, '#5783a6');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, 750, 900, 200);

  // Gentle wave highlights
  for (let y = 760; y < 940; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(300, y + 4, 600, y - 4, 900, y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Giant coastal rock formation at the bottom
  const rockGrad = ctx.createLinearGradient(0, 880, 0, 1200);
  rockGrad.addColorStop(0, '#9e9e98');
  rockGrad.addColorStop(0.4, '#76766f');
  rockGrad.addColorStop(1, '#4c4c47');
  ctx.fillStyle = rockGrad;
  ctx.beginPath();
  ctx.moveTo(0, 960);
  ctx.bezierCurveTo(240, 910, 480, 890, 700, 910);
  ctx.bezierCurveTo(790, 920, 850, 940, 900, 960);
  ctx.lineTo(900, 1200);
  ctx.lineTo(0, 1200);
  ctx.closePath();
  ctx.fill();

  // Rock surface texture cracks & facets
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    const rx = (i * 47) % 900;
    const ry = 920 + (i * 17) % 250;
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 80, ry + 15);
    ctx.lineTo(rx + 140, ry + 8);
    ctx.strokeStyle = 'rgba(40, 40, 35, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Person standing on the rock (like Screenshot 4)
  // White dress, long hair, facing the sea
  ctx.save();
  // Body & White Dress
  ctx.beginPath();
  ctx.moveTo(520, 520); // head
  ctx.bezierCurveTo(500, 570, 480, 680, 460, 870); // dress left flare
  ctx.lineTo(580, 870); // dress bottom
  ctx.bezierCurveTo(560, 680, 545, 570, 530, 520); // dress right
  ctx.closePath();
  const dressGrad = ctx.createLinearGradient(460, 520, 580, 870);
  dressGrad.addColorStop(0, '#fbfcfe');
  dressGrad.addColorStop(0.5, '#e4ebf5');
  dressGrad.addColorStop(1, '#c5d5e8');
  ctx.fillStyle = dressGrad;
  ctx.fill();

  // Bare arms
  ctx.beginPath();
  ctx.ellipse(545, 600, 12, 50, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#e8b898';
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(522, 490, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#e8b898';
  ctx.fill();

  // Dark flowing hair in breeze
  ctx.beginPath();
  ctx.moveTo(515, 470);
  ctx.bezierCurveTo(535, 460, 555, 490, 558, 560);
  ctx.bezierCurveTo(565, 610, 560, 650, 550, 670);
  ctx.bezierCurveTo(538, 640, 530, 540, 510, 510);
  ctx.closePath();
  ctx.fillStyle = '#2d2524';
  ctx.fill();

  // Legs & bare feet on stone
  ctx.beginPath();
  ctx.rect(495, 870, 18, 45);
  ctx.rect(530, 870, 18, 45);
  ctx.fillStyle = '#e8b898';
  ctx.fill();
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}
