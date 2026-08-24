# AGENTS.md

Clon de Asteroids en JavaScript puro (HTML5 Canvas). Sin framework, sin bundler, sin `package.json`, sin tests, sin lint, sin CI. Todo el juego vive en un único archivo `game.js` (~420 líneas), cargado por `index.html` con un `<script>` plano.

## Verificación

No hay toolchain: nada de `npm install`, lint ni tests. La única forma de verificar cambios es manual, en el navegador:

```bash
npx serve .   # o abrir index.html directamente (doble clic)
```

## Estructura de game.js

- Entidades como clases (`Bullet`, `Asteroid`, `Ship`, `Particle`) + arrays de estado a nivel de módulo (`bullets`, `asteroids`, `particles`).
- Máquina de estados global: `state` ∈ `'playing' | 'dead' | 'gameover'` (game.js:241); cada estado tiene su rama temprana en `update(dt)`.
- Loop único: `requestAnimationFrame` → `update(dt)` → `draw()`; `dt` en segundos, limitado a 0.05 s.
- Input de una sola pulsación: patrón `justPressed`/`pressed()` — `pressed()` consume el flag, se llama una vez por frame desde `update`.
- Espacio toroidal: toda entidad se envuelve con `wrap()` (game.js:27); las partículas son la excepción (no se envuelven).
- Tuning de asteroides en los arrays `RADII`, `SPEEDS`, `POINTS`, indexados por tamaño 1–3 (game.js:61). Tuning de la nave (rotación, empuje, drag) como constantes locales en `Ship.update` (game.js:143).
- `tryShoot()` devuelve un array (se hace spread en `bullets.push(...)`), no una bala suelta.

## Gotchas

- El tamaño del canvas 800×600 está duplicado: constantes `W`/`H` en `game.js` y atributos del `<canvas>` en `index.html`. Cambiar uno sin el otro desincroniza el juego.
- El README está desactualizado: menciona power-ups y una "estrella fugaz" que no existen en el código. La fuente de verdad es `game.js`.
- Idioma: comentarios, README y textos del HUD/overlays en español. Mantenerlo.
- Estilo (nada lo impone automáticamente): comillas simples, punto y coma, indentación de 2 espacios, constantes en MAYÚSCULAS para valores de tuning.
