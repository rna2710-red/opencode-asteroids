'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// Trazado del polígono del casco; el llamador hace el stroke
function drawHull(hull) {
  ctx.beginPath();
  ctx.moveTo(hull[0][0], hull[0][1]);
  for (let i = 1; i < hull.length; i++)
    ctx.lineTo(hull[i][0], hull[i][1]);
  ctx.closePath();
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// Tuning del power-up de velocidad
const SPEED_DROP_CHANCE = 0.10;   // probabilidad al destruir un asteroide
const SPEED_DURATION    = 5;      // segundos de efecto
const SPEED_MULT        = 2;      // multiplicador de empuje
const SPEED_DROP_TTL    = 10;     // segundos en pantalla si no se recoge

// Tuning del power-up de triple disparo
const TRIPLE_DROP_CHANCE = 0.10;  // probabilidad al destruir un asteroide
const TRIPLE_DURATION    = 5;     // segundos de efecto
const TRIPLE_SPREAD      = 8;     // separación lateral entre balas (px)
const TRIPLE_DROP_TTL    = 10;    // segundos en pantalla si no se recoge

// Tuning del power-up de escudo
const SHIELD_DROP_CHANCE = 0.08;  // probabilidad al destruir un asteroide
const SHIELD_DURATION    = 5;     // segundos de efecto
const SHIELD_DROP_TTL    = 10;    // segundos en pantalla si no se recoge
const SHIELD_RADIUS      = 25;    // radio de contacto del escudo

// Tuning de la estrella fugaz
const STAR_SPEED    = [270, 342]; // px/s (mucho más rápido que asteroides normales)
const STAR_TTL      = 6;          // segundos en pantalla
const STAR_POINTS   = 250;        // bonus por destruirla
const STAR_INTERVAL = [8, 16];    // segundos entre apariciones

// ── Skins de la nave (cosméticas) ────────────────────────────────────────────
const SKINS = [
  {
    name: 'CLÁSICA',
    color: '#fff',
    hull: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    flame: 'rgba(255, 130, 0, 0.85)',
  },
  {
    name: 'CAZA',
    color: '#ff5252',
    hull: [[23, 0], [-14, -6], [-6, 0], [-14, 6]],
    flame: 'rgba(255, 82, 82, 0.85)',
  },
  {
    name: 'EXPLORADORA',
    color: '#0ff',
    hull: [[16, 0], [-4, -8], [-14, -12], [-10, 0], [-14, 12], [-4, 8]],
    flame: 'rgba(255, 255, 255, 0.85)',
  },
  {
    name: 'ALIENÍGENA',
    color: '#b6ff00',
    hull: [[18, 0], [2, -11], [-15, -7], [-15, 7], [2, 11]],
    flame: 'rgba(182, 255, 0, 0.85)',
  },
  {
    name: 'FANTASMA',
    color: 'rgba(255, 255, 255, 0.45)',
    hull: [[20, -2], [4, -10], [-13, -6], [-9, 0], [-13, 6], [4, 10]],
    flame: 'rgba(255, 255, 255, 0.35)',
  },
];

const SKIN_KEY = 'asteroids.skin';

function loadSkinIndex() {
  try {
    const v = parseInt(localStorage.getItem(SKIN_KEY), 10);
    if (Number.isInteger(v) && v >= 0 && v < SKINS.length) return v;
  } catch (e) { /* storage bloqueado */ }
  return 0;
}

function saveSkinIndex() {
  try { localStorage.setItem(SKIN_KEY, String(skinIndex)); } catch (e) { /* noop */ }
}

let skinIndex = loadSkinIndex();

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size   = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.color  = '#fff';
    this.dead   = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor() {
    const side = randInt(0, 3);
    let x, y;
    if      (side === 0) { x = rand(0, W); y = -RADII[1]; }
    else if (side === 1) { x = W + RADII[1]; y = rand(0, H); }
    else if (side === 2) { x = rand(0, W); y = H + RADII[1]; }
    else                 { x = -RADII[1]; y = rand(0, H); }
    super(x, y, 1);

    const tx = rand(W * 0.25, W * 0.75);
    const ty = rand(H * 0.25, H * 0.75);
    const angle = Math.atan2(ty - this.y, tx - this.x);
    const speed = rand(STAR_SPEED[0], STAR_SPEED[1]);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-3, 3);
    this.color = '#ff3b3b';
    this.points = STAR_POINTS;
    this.ttl = STAR_TTL;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) {
      explode(this.x, this.y, 6);
      this.dead = true;
    }
  }

  draw() {
    if (this.ttl < 1.5 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const k = 0.25;
    ctx.strokeStyle = 'rgba(255, 59, 59, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * k, this.y - this.vy * k);
    ctx.stroke();

    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();

    super.draw();
  }
}

// ── PowerUps (velocidad / triple disparo / escudo) ────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    this.type   = type;
    this.radius = 10;
    this.ttl    = type === 'triple' ? TRIPLE_DROP_TTL
                : type === 'shield' ? SHIELD_DROP_TTL : SPEED_DROP_TTL;
    this.color  = type === 'triple' ? '#ffd23f'
                : type === 'shield' ? '#3f3' : '#0ff';
    this.dead   = false;
  }

  update(dt) {
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo justo antes de desaparecer
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const pulse = 1 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    if (this.type === 'triple') {         // símbolo "≡"
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(-4, i * 3);
        ctx.lineTo(4, i * 3);
      }
    } else if (this.type === 'shield') {  // símbolo de escudo
      ctx.moveTo( 0, -6);
      ctx.lineTo( 5, -4);
      ctx.lineTo( 5,  1);
      ctx.lineTo( 0,  6);
      ctx.lineTo(-5,  1);
      ctx.lineTo(-5, -4);
      ctx.closePath();
    } else {                              // símbolo "»"
      ctx.moveTo(-5, -5);
      ctx.lineTo(-1, 0);
      ctx.lineTo(-5, 5);
      ctx.moveTo(1, -5);
      ctx.lineTo(5, 0);
      ctx.lineTo(1, 5);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.tripleTimer   = 0;
    this.shieldTimer   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;

    const ROT    = 3.5;   // rad/s
    const BOOST  = this.speedTimer > 0 ? SPEED_MULT : 1;
    const THRUST = 260 * BOOST;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;

    if (this.tripleTimer > 0) {
      // 3 balas paralelas: misma dirección, separadas perpendicularmente
      const px = Math.cos(this.angle + Math.PI / 2);
      const py = Math.sin(this.angle + Math.PI / 2);
      return [-TRIPLE_SPREAD, 0, TRIPLE_SPREAD].map(off =>
        new Bullet(ox + px * off, oy + py * off, this.angle));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    drawHull(skin.hull);
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = this.speedTimer > 0 ? 'rgba(0, 230, 255, 0.85)' : skin.flame;
      ctx.stroke();
    }

    ctx.restore();

    // Burbuja de escudo activo, parpadea justo antes de expirar
    if (this.shieldTimer > 0 &&
        !(this.shieldTimer < 1.5 && Math.floor(this.shieldTimer * 8) % 2 === 0)) {
      const pulse = 1 + Math.sin(performance.now() / 120) * 0.05;
      ctx.strokeStyle = 'rgba(51, 255, 51, 0.75)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, SHIELD_RADIUS * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let starTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship      = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  starTimer = rand(STAR_INTERVAL[0], STAR_INTERVAL[1]);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  asteroids = asteroids.filter(a => !a.dead);
  ship.reset();
  spawnAsteroids(3 + level);
  starTimer = rand(STAR_INTERVAL[0], STAR_INTERVAL[1]);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function destroyAsteroid(a) {
  a.dead = true;
  score += a.points;
  explode(a.x, a.y, a.size * 5);
  const r = Math.random();
  if (r < SHIELD_DROP_CHANCE)
    powerups.push(new PowerUp(a.x, a.y, 'shield'));
  else if (r < SHIELD_DROP_CHANCE + SPEED_DROP_CHANCE)
    powerups.push(new PowerUp(a.x, a.y, 'speed'));
  else if (r < SHIELD_DROP_CHANCE + SPEED_DROP_CHANCE + TRIPLE_DROP_CHANCE)
    powerups.push(new PowerUp(a.x, a.y, 'triple'));
  return a.split();
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead        = true;
  ship.speedTimer  = 0;
  ship.tripleTimer = 0;
  ship.shieldTimer = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambiar de skin funciona en cualquier estado
  if (pressed('KeyC')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    saveSkinIndex();
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  // Estrella fugaz
  starTimer -= dt;
  if (starTimer <= 0) {
    asteroids.push(new ShootingStar());
    starTimer = rand(STAR_INTERVAL[0], STAR_INTERVAL[1]);
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      // Recogerlo refresca la duración
      if (p.type === 'triple')      ship.tripleTimer = TRIPLE_DURATION;
      else if (p.type === 'shield') ship.shieldTimer = SHIELD_DURATION;
      else                          ship.speedTimer  = SPEED_DURATION;
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        newAsteroids.push(...destroyAsteroid(a));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    const contactRadius = ship.shieldTimer > 0 ? SHIELD_RADIUS : ship.radius;
    const shieldSplits  = [];
    for (const a of asteroids) {
      if (dist(ship, a) >= contactRadius + a.radius * 0.82) continue;
      if (ship.shieldTimer <= 0) { killShip(); break; }
      shieldSplits.push(...destroyAsteroid(a));
    }
    asteroids = asteroids.filter(a => !a.dead).concat(shieldSplits);
  }

  // Nivel completado
  if (asteroids.filter(a => !(a instanceof ShootingStar)).length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[skinIndex];
  const SCALE = 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(SCALE, SCALE);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2 / SCALE;
  ctx.lineJoin    = 'round';
  drawHull(skin.hull);
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  let hudLine = 46;
  if (ship.speedTimer > 0) {
    ctx.fillStyle = '#0ff';
    ctx.fillText(`VELOCIDAD ${ship.speedTimer.toFixed(1)}s`, 14, hudLine);
    hudLine += 20;
  }
  if (ship.tripleTimer > 0) {
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(`TRIPLE ${ship.tripleTimer.toFixed(1)}s`, 14, hudLine);
    hudLine += 20;
  }
  if (ship.shieldTimer > 0) {
    ctx.fillStyle = '#3f3';
    ctx.fillText(`ESCUDO ${ship.shieldTimer.toFixed(1)}s`, 14, hudLine);
  }
  ctx.fillStyle = '#fff';

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR   —   C: NAVE`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
