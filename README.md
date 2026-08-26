# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. A veces sueltan un power-up de velocidad, de triple disparo o de escudo.

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
| `C`       | Cambiar de skin de la nave (en cualquier estado del juego) |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |
| Estrella fugaz | 250 |

## Power-ups

| Power-up  | Efecto                        | Duración | Cómo se obtiene                                                                 |
| --------- | ----------------------------- | -------- | ------------------------------------------------------------------------------- |
| Velocidad | Duplica el empuje de la nave  | 5 s      | Drop aleatorio (~10 %) al destruir un asteroide; desaparece a los 10 s del mapa |
| Triple disparo | La nave dispara 3 balas paralelas | 5 s | Drop aleatorio (~10 %) al destruir un asteroide; desaparece a los 10 s del mapa |
| Escudo    | Destruye al contacto los asteroides que tocan su burbuja (con puntos) | 5 s | Drop aleatorio (~8 %) al destruir un asteroide; desaparece a los 10 s del mapa |

Mientras están activos, el HUD muestra el tiempo restante (`VELOCIDAD 3.2s` en cian, `TRIPLE 3.2s` en amarillo, `ESCUDO 3.2s` en verde); el escudo se dibuja como una burbuja verde alrededor de la nave que parpadea justo antes de expirar. Recoger otro power-up igual refresca la duración; morir o pasar de nivel lo cancela.

## Skins

La tecla `C` cicla entre 5 skins de la nave (clásica, caza, exploradora, alienígena, fantasma): cambian el casco, el color del trazo y la llama del propulsor. La elección se guarda en `localStorage` y sobrevive a recargas; también se refleja en los iconos de vidas del HUD.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad (drop de asteroides) con contador en el HUD
- Power-up de triple disparo (drop de asteroides): 3 balas paralelas durante 5 s
- Power-up de escudo (drop de asteroides): burbuja verde que desintegra los asteroides que la tocan
- 5 skins de nave conmutables con `C` y persistencia en `localStorage`
- Estrella fugaz: asteroide rápido que cruza la pantalla cada 8–16 s y desaparece a los 6 s; da 250 puntos si se destruye
