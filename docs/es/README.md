<h1 align="center">
  <img alt="Icono" src="../imgs/icon.png" width="28"> TradingWorks+
</h1>

<p align="center">
  Marca tu entrada y salida, controla tu jornada y tu bolsa de horas, y recibe avisos en el momento justo — sin tener que dejar TradingWorks abierto todo el día.
</p>

<div align="center">

  [![Versión](https://img.shields.io/badge/versi%C3%B3n-3.0.0-7c9a4e?logo=googlechrome&logoColor=white)](https://github.com/ErnaneJ/tradingworks-plus/releases)
  [![Licencia](https://img.shields.io/badge/licencia-MIT-blue)](../../LICENSE.md)
  [![Manifest V3](https://img.shields.io/badge/manifest-v3-orange?logo=googlechrome&logoColor=white)](../../src/manifest.json)
  [![Svelte](https://img.shields.io/badge/svelte-4-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev)

</div>

<p align="center">
  <a href="../../README.md">Português (Brasil)</a> ·
  <a href="../en/README.md">English</a>
</p>

<p align="center">
  <img alt="Vista previa del popup y del panel de opciones" src="../imgs/popup/full.png" width="320">
</p>

## Contenido

- [Qué es](#qué-es)
- [Funcionalidades](#funcionalidades)
- [Popup: 11 formatos](#popup-11-formatos)
- [Panel de opciones](#panel-de-opciones)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Privacidad](#privacidad)
- [Contribuir](#contribuir)
- [Apoya el proyecto](#apoya-el-proyecto)

## Qué es

TradingWorks+ es una extensión de navegador no oficial, sin ningún vínculo con la empresa TWO, que agiliza el uso diario de [TradingWorks](https://app.tradingworks.net/). En vez de entrar a la plataforma y navegar por varias pantallas, marcas tu entrada, revisas el saldo del día y recibes avisos directamente desde el navegador.

<p align="center">
  <b>Esta extensión solo reorganiza, de forma más práctica, datos que la propia plataforma TradingWorks ya pone a disposición del colaborador.</b>
</p>

## Funcionalidades

- **Marcación en un clic**, con el estado actual (trabajando, en descanso, jornada finalizada);
- **Línea de tiempo del día**, con entradas, descansos y horas extra lado a lado;
- **Bolsa de horas**, con saldo actual e historial mes a mes;
- **Historial de marcaciones**, con los registros de días anteriores;
- **Panel de equipo**, para quien necesite revisar o aprobar marcaciones de otras personas;
- **Notificaciones configurables** por evento (entrada, salida, fin de descanso, jornada por terminar, horas extra, etc.), entregadas por notificación del navegador, webhook genérico o Discord;
- **11 formatos de popup**, desde un vistazo mínimo hasta el panel completo;
- **Tema claro, oscuro o automático**;
- Interfaz en **portugués (predeterminado), inglés y español**.

_Nota: los datos se leen directamente de tu sesión de TradingWorks ya autenticada en el navegador — la extensión nunca pide usuario ni contraseña, solo reutiliza la sesión que ya tienes abierta._

## Popup: 11 formatos

Haz clic en el ícono de formato en el encabezado del popup para alternar entre ellos, del más simple al más completo. Algunos ejemplos:

<table>
  <tr>
    <td align="center"><img src="../imgs/popup/minimal.png" width="160"><br><sub>Minimal</sub></td>
    <td align="center"><img src="../imgs/popup/ring.png" width="160"><br><sub>Ring</sub></td>
    <td align="center"><img src="../imgs/popup/stats.png" width="160"><br><sub>Stats</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="../imgs/popup/week.png" width="160"><br><sub>Week</sub></td>
    <td align="center"><img src="../imgs/popup/timebank.png" width="160"><br><sub>Bolsa de horas</sub></td>
    <td align="center"><img src="../imgs/popup/full.png" width="160"><br><sub>Full</sub></td>
  </tr>
</table>

Los otros cinco (standard, compact, timeline, classic y approvals) forman parte del mismo ciclo, directo en el popup.

## Panel de opciones

<table>
  <tr>
    <td align="center"><img src="../imgs/options/painel.png" width="260"><br><sub>Panel</sub></td>
    <td align="center"><img src="../imgs/options/notificacoes.png" width="260"><br><sub>Notificaciones</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="../imgs/options/historico.png" width="260"><br><sub>Historial de marcaciones</sub></td>
    <td align="center"><img src="../imgs/options/equipe.png" width="260"><br><sub>Equipo</sub></td>
  </tr>
</table>

> Las capturas anteriores usan datos ficticios de demostración — ninguna corresponde a una empresa o colaborador real.

## Tecnologías

- [Svelte 4](https://svelte.dev) + [TypeScript](https://www.typescriptlang.org/) + [Vite 5](https://vitejs.dev)
- Extensión de Chrome **Manifest V3** (service worker, `chrome.alarms`, `chrome.storage`, `chrome.notifications`)
- [Vitest](https://vitest.dev) para las pruebas

## Instalación

### Desde la Chrome Web Store (recomendado)

[Instalar TradingWorks+ desde la Chrome Web Store](https://chromewebstore.google.com/detail/tradingworks+/gekmgdfmjoccmkagkbcboidgknlolihl)

### Manualmente, desde el código fuente

Usa esta vía si quieres probar una rama específica o contribuir al proyecto.

```bash
git clone git@github.com:ErnaneJ/tradingworks-plus.git
cd tradingworks-plus
npm install
npm run build
```

Luego:

1. Abre `chrome://extensions`;

  <p align="center"><img alt="Accediendo a la sección de extensiones" src="../imgs/en/extensions.png" width="520"></p>

2. Activa el **Modo de desarrollador**;

  <p align="center"><img alt="Activando el modo de desarrollador" src="../imgs/en/dev.png" width="520"></p>

3. Haz clic en **Cargar descomprimida** y selecciona la carpeta `dist/` generada por el build;

  <p align="center"><img alt="Cargando la extensión" src="../imgs/en/load.png" width="520"></p>

4. Listo — el ícono de TradingWorks+ aparece en la barra de extensiones.

  <p align="center"><img alt="Extensión cargada" src="../imgs/ok.png" width="520"></p>

## Privacidad

La extensión no envía los datos de tu marcación a ningún servidor propio: todo se guarda localmente en el navegador (`chrome.storage.local`), y solo sale de tu dispositivo si tú mismo configuras un webhook o una integración con Discord en Notificaciones. Detalles completos en la [Política de Privacidad](../privacy_policy/en.md) (disponible en inglés y portugués).

## Contribuir

¿Encontraste un problema o quieres sugerir algo? Abre un [issue](https://github.com/ErnaneJ/tradingworks-plus/issues/new). ¿Quieres contribuir con código?

```bash
npm run dev       # build en modo watch
npm run typecheck # TypeScript + svelte-check
npm run test      # Vitest
```

Carga la carpeta `dist/` como extensión descomprimida (paso 3 de la instalación manual) para ver tus cambios en acción. Al terminar, abre un PR — toda contribución es bienvenida.

## Apoya el proyecto

Cualquier crítica constructiva es bienvenida. Si TradingWorks+ te ahorra tiempo en el día a día, considera apoyar el proyecto:

<p align="center">
  <a href="https://github.com/sponsors/ErnaneJ">
    <img alt="Buy Me a Coffee" src="../imgs/buy-me-a-coffee.png" width="260">
  </a>
</p>

---

<div align="center">
  2023–2026 · <b>TradingWorks+</b> · <a href="https://github.com/ErnaneJ/tradingworks-plus/blob/main/LICENSE.md">MIT</a>
</div>
