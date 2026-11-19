# Recorrido público e instalación

El recorrido de la landing usa un bloque compacto: introducción y pasos con contraste legible junto al carrusel en escritorio; una columna en móvil. La primera captura se carga sin diferirla hasta una interacción. Las tres capturas existentes son del laboratorio de demostración, no de clientes. Los enlaces para ampliarlas y los controles del carrusel se conservan. No se cambió Qubito ni el catálogo comercial.

La página pública `/instalar` reutiliza `worker/commercial-header.html`, sus estilos y el pie de la landing. Conserva logo oficial, navegación móvil y enlaces al inicio. Las instrucciones por plataforma, eventos de instalación, manifest y service worker permanecen intactos. Las páginas de instalación del tenant conservan su alcance anterior.

`npm run test:public-browser` verifica en Chromium Linux a 1440 y 390 píxeles: carga y dimensiones de la primera imagen, navegación hasta todas las capturas, legibilidad de pasos, ausencia de desbordamiento, logo y navegación móvil en instalación, pie y manifest. Capturas en `/tmp/qubo-public-browser`. `npm run test:pwa-browser` comprueba instalación/emulación y comportamiento offline existente; no equivale a una prueba con un teléfono físico ni al despliegue de Hostinger.
