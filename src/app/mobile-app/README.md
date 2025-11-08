# CodevaMP Companion (Expo)

Aplicación móvil creada con Expo y React Native para ofrecer a los jugadores el asistente de draft de Mobile Legends sincronizado con la plataforma web de CodevaMP.

## Requisitos

- Node.js 18+
- `npm` o `yarn`
- CLI de Expo (`npm install -g expo-cli`) si deseas usar los comandos interactivos

## Scripts principales

```bash
npm install
npm run start        # Levanta Metro Bundler con la app en modo desarrollo
npm run android      # Compila y lanza en un emulador/dispositivo Android
npm run ios          # Compila y lanza en un simulador/dispositivo iOS
npm run web          # Vista previa web
npm run lint         # Analiza el código con las reglas de Expo
```

## Configuración de entorno compartido

La app móvil consume los mismos endpoints REST que la app web mediante `@shared/api`. Define la URL base del backend (Next.js) con la variable `EXPO_PUBLIC_API_BASE_URL`:

```bash
EXPO_PUBLIC_API_BASE_URL="https://codevamp.dev" npm run start
```

Si no se define, se asume `http://localhost:3000`.

## Flujos de build

Las builds clásicas de Expo siguen estando disponibles:

```bash
npm run build:android
npm run build:ios
```

Para proyectos productivos se recomienda migrar a [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npx expo login
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

## Publicación y distribución

1. Genera las builds de distribución (`apk`/`aab` y `.ipa`) usando `expo build` o `eas build`.
2. Firma los artefactos si utilizas flujos nativos (`gradlew bundleRelease` / Xcode Archive) y sube a Google Play Console o App Store Connect.
3. Documenta las credenciales en el equipo y conserva los archivos `.keystore`/certificados.
4. Actualiza la página de producto con capturas de pantalla y la descripción alineada con la web.
5. Comparte el enlace público, o aloja el APK firmado en un repositorio interno y adjunta el código QR que se genera automáticamente en `expo build`.

### Instalación interna (APK)

- Habilita "instalar apps de origen desconocido" en el dispositivo.
- Descarga el APK firmado y ábrelo desde el administrador de archivos.
- Acepta los permisos solicitados (solo acceso a internet).

### Store listing

- **Google Play**: sube un Android App Bundle (`.aab`), configura `com.codevamp.companion` y habilita testers internos.
- **App Store**: sube el `.ipa` desde Transporter o `eas submit`, rellena los metadatos en App Store Connect y asigna TestFlight.

## Estructura del proyecto

- `app.config.ts`: iconos, splash screen, permisos y variables `extra`.
- `assets/`: recursos gráficos para iconos y pantallas de carga.
- `src/`: componentes portados desde la web y servicios compartidos.
- `../shared/`: funciones reutilizadas tanto por Next.js como por Expo.

Para expandir la app puedes añadir nuevas pantallas en `src/screens` y reutilizar la capa de datos compartida.