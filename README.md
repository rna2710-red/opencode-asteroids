# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. A veces sueltan un power-up de velocidad.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-ups

| Power-up  | Efecto                        | Duración | Cómo se obtiene                                                                 |
| --------- | ----------------------------- | -------- | ------------------------------------------------------------------------------- |
| Velocidad | Duplica el empuje de la nave  | 5 s      | Drop aleatorio (~10 %) al destruir un asteroide; desaparece a los 10 s del mapa |

Mientras está activo, la llama del propulsor se ve cian y el HUD muestra el tiempo restante (`VELOCIDAD 3.2s`). Recoger otro refresca la duración; morir o pasar de nivel lo cancela.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad (drop de asteroides) con contador en el HUD
