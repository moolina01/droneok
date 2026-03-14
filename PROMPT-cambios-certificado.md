# Rediseño del Certificado PDF — Lo que necesito cambiar

## EL PROBLEMA ACTUAL

El certificado PDF que genera la app tiene párrafos largos de análisis (resumen, conclusiones) que nadie lee cuando el vendedor sube el PDF como imagen a MercadoLibre o Facebook. Además muestra datos básicos (vuelos, tiempo, distancia) que el comprador ya puede ver en DJI Fly, así que no agrega valor diferencial.

El PDF se usa de dos formas: como documento formal Y como imagen en publicaciones de venta. Hoy solo funciona bien como documento, pero como imagen es ilegible.

## QUÉ QUIERO CAMBIAR

### 1. Reemplazar los párrafos de análisis por HALLAZGOS con tags visuales

En vez de los bloques de texto "RESUMEN DEL ANÁLISIS" y "CONCLUSIONES", quiero filas individuales de hallazgos. Cada hallazgo tiene:

- Icono a la izquierda con fondo de color
- Título corto en bold (máx 50 caracteres). Ej: "Inconsistencia en ciclos de batería"
- Detalle en gris debajo (máx 2 líneas). Ej: "0 ciclos registrados con 1 vuelo existente. Posible reset de firmware."
- Tag de estado a la derecha con color:
  - **LIMPIO / ÓPTIMO** → verde (#34D399, fondo #0D2E24)
  - **REVISAR / ATENCIÓN / DATOS BAJOS** → ámbar (#FBBF24, fondo #2A2310)
  - **ALERTA / RIESGO** → rojo (#F87171, fondo #2C1517)

Los hallazgos se generan dinámicamente según los datos. Reglas base:

```
SI ciclos_bateria == 0 AND vuelos > 0 → WARN "Inconsistencia en ciclos de batería"
SI desbalance_celdas > 0.1V → ALERT "Desbalance crítico entre celdas"
SI desbalance_celdas > 0.05V → WARN "Desbalance entre celdas: {valor}V"
SI crashes > 0 → ALERT "{N} crash(es) detectado(s)"
SI perdida_senal > 0 → WARN "{N} pérdida(s) de señal registrada(s)"
SI vuelos < 5 → WARN "Historial extremadamente limitado"
SI crashes == 0 AND failsafe == 0 AND perdida_senal == 0 → OK "Sin eventos críticos detectados"
SI degradacion_bateria < 5% → OK "Batería en excelente condición"
SI degradacion_bateria > 20% → ALERT "Degradación significativa de batería"
```

### 2. Hacer los datos técnicos compactos

Las tablas de "Salud de batería" y "Confiabilidad" deben ser dos cards lado a lado con formato label-valor en filas cortas, no párrafos. Valores en color según estado (verde si ok, ámbar si atención, rojo si problema).

### 3. Agregar nota de confianza

Un card al final con fondo ámbar sutil que diga qué tan fiable es el análisis:
- **Alta** (20+ vuelos, datos consistentes)
- **Media** (5-19 vuelos o algunas inconsistencias)  
- **Baja** (< 5 vuelos o señales de manipulación)

Con texto tipo: "Confianza media. Con tan pocos registros, el score no refleja uso real. Solicita más logs al vendedor."

### 4. El score con arco de color

El score circular debe tener un arco visual proporcional al puntaje, con color según rango:
- 80-100: Verde → "EXCELENTE"
- 60-79: Ámbar → "ACEPTABLE"
- 40-59: Naranja → "REGULAR"
- 0-39: Rojo → "RIESGO"

### 5. Cambiar subtítulo

De "Certificado de Salud del Dron" a "Diagnóstico de Historial". Porque eso es lo que nos diferencia: diagnosticamos, no solo reportamos datos.

## QUÉ NO CAMBIAR

- La estructura general del header (logo, fecha, ID)
- El número de serie y datos de identificación del dron
- La tabla de últimos vuelos
- El footer con link de verificación, QR e ID
- Que todo quepa en 1 página
- El fondo oscuro y la paleta de colores actual

## RESUMEN

Básicamente: sacar los párrafos largos, meter hallazgos visuales con tags de color como sección principal, compactar los datos técnicos, y agregar la nota de confianza. El certificado debe leerse tanto como documento abierto como imagen reducida en un marketplace.
