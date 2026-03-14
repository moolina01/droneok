# Agregar ícono animado de DroneOK

Quiero que uses el ícono SVG de DroneOK (el archivo `droneok-icon-final.svg`) en la plataforma web y le agregues dos animaciones:

1. **Las aspas giran** — Las 4 líneas diagonales que salen del círculo deben rotar continuamente alrededor del centro del círculo, como rotores de dron girando. Rotación suave e infinita, velocidad moderada (~2-3 segundos por vuelta).

2. **El check se dibuja** — El path del check (✓) dentro del círculo debe tener una animación de "draw" donde el trazo se dibuja progresivamente de izquierda a derecha, como si alguien lo estuviera escribiendo. Esto debe pasar una sola vez al cargar, duración ~0.6 segundos, con un delay de 0.5s para que primero se vean las aspas girando y después aparezca el check.

## Estructura del ícono SVG

El ícono tiene 3 partes:
- **Círculo** — `<circle>` que forma la O (estático, no se anima)
- **4 aspas diagonales** — `<line>` en las 4 esquinas a 45° (estas giran)
- **Check** — `<path>` con el trazo del ✓ (este se dibuja)

## Técnica sugerida

Para las aspas: envolver las 4 líneas en un `<g>` con `transform-origin: center` y aplicar `@keyframes spin { to { transform: rotate(360deg) } }`.

Para el check: usar `stroke-dasharray` y `stroke-dashoffset` animando de offset completo a 0, lo que crea el efecto de dibujo progresivo.

## Colores
- Fondo claro: verde `#059669`
- Fondo oscuro: verde `#34D399`

## Dónde usarlo
Usar este ícono animado en el header/navbar de la web y como loading state cuando se está generando un certificado.
