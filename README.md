# DDNPANEL

Un panel de control moderno con interfaz tipo sistema operativo (inspirado claramente en el sistema de la manzana) construido con Next.js, diseñado para la gestión de archivos, medios y herramientas de sistema en entornos locales o servidores personales.


##  Características

- **Interfaz Multi-ventana**: Sistema de ventanas arrastrables, redimensionables y minimizables (WindowManager).
- **Gestión de Archivos**: Explorador completo con soporte para:
  - Navegación de carpetas.
  - Carga y descarga de archivos.
  - Previsualización de imágenes, videos y audio.
  - Editor de texto integrado.
  - Compresión y descompresión (ZIP).
- **Detección de Discos Externos**: Capacidad de detectar e interactuar con unidades USB y discos montados en `/media` o `/mnt`.
- **Dock Dinámico**: Acceso rápido a aplicaciones y gestión de ventanas minimizadas con indicadores visuales.
- **Personalización**:
  - Cambio dinámico de temas (Primary colors).
  - Selección y subida de Wallpapers.
  - Soporte multi-idioma (Español/Inglés).
- **Dashboard Personalizable**: Accesos directos editables con iconos y colores personalizados.
- **Docker Ready**: Configuración optimizada para despliegue rápido con mapeo de usuarios (`PUID/PGID`) y persistencia.

## Stack Tecnológico

- **Frontend**: Next.js 15+, React, Tailwind CSS v4, Lucide React.
- **Backend**: Next.js API Routes (Node.js).
- **Autenticación**: Auth.js (NextAuth).
- **Contenedorización**: Docker & Docker Compose.

## Instalación

### Requisitos previos
- Docker y Docker Compose instalados.

### Despliegue con Docker (Recomendado)

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/mauriziock/ddnpanel.git
   cd ddnpanel
   ```

2. **Configurar variables de entorno**:
   Copia el archivo de ejemplo y genera tu `AUTH_SECRET`:
   ```bash
   cp .env.example .env
   # Genera un secret aleatorio
   openssl rand -base64 32 # Pégalo en AUTH_SECRET en tu .env
   ```

3. **Ejecutar el contenedor**:
   ```bash
   docker-compose up -d --build
   ```

4. **Acceso**: `http://localhost:3000`

### Credenciales por Defecto
- **Usuario**: `admin`
- **Contraseña**: `admin`

## Configuración Especial

### 1. Uso detrás de un Reverse Proxy (Nginx Proxy Manager, Traefik, etc.)
Si vas a exponer el panel a través de un dominio con SSL mediante un proxy, asegúrate de:
- Configurar `AUTH_TRUST_HOST=true` en el `docker-compose.yml` (activado por defecto en la versión actual).
- (Opcional) Definir `NEXTAUTH_URL=https://tu-dominio.com` si experimentas problemas con las redirecciones.
- Si usas **Nginx Proxy Manager**, activa la opción "Websockets Support" para una mejor experiencia.

### 2. Gestión de Permisos (PUID/PGID)
El contenedor está diseñado para trabajar con los archivos de tu host sin problemas de permisos:
- **Mapeo automático**: Usa `PUID` y `PGID` en el `docker-compose.yml` para coincidir con tu usuario de Linux (típicamente `1000`).
- **Resolución de Conflictos**: El script de entrada (`entrypoint.sh`) resuelve automáticamente conflictos con el usuario `node` (UID 1000) interno de Alpine, permitiendo que asignes el ID 1000 a la aplicación sin errores.
- **Acceso a Unidades**: Al usar `privileged: true` y montajes `rslave`, el panel detectará automáticamente discos USB o unidades montadas en el host en tiempo real.

## Mantenimiento y Seguridad

### 1. Restablecimiento de Contraseña
Si pierdes el acceso al panel, puedes restablecer cualquier contraseña desde la terminal de tu host:
```bash
docker exec -it ddnpanel node scripts/reset-password.js <usuario> <nueva_contraseña>
```
*(Nota: El nombre del contenedor por defecto es `ddnpanel`)*

## Estructura de Archivos

- `/app`: Rutas del frontend y API.
- `/components`: Componentes de la interfaz (Window, Dock, File Manager, etc.).
- `/files-storage`: Almacenamiento persistente de archivos de usuario.
- `/config`: Archivos de configuración de sistema (usuarios, carpetas).
- `/scripts`: Utilidades administrativas por línea de comandos.

## Licencia y Descargo de Responsabilidad

Este proyecto está bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

**Aviso Legal**: Este software es un proyecto personal con fines educativos y de gestión de servidores. El diseño visual está inspirado en interfaces de sistemas operativos modernos, pero no utiliza código, recursos gráficos o marcas registradas propiedad de Apple Inc. Todos los iconos son proporcionados por Lucide React (Licencia ISC).

**Disclaimer Personal**
Este es un proyecto peronsal, sientete libre de compartirlo, modificarlo y usarlo cómo desees.
No cuento con mucho tiempo para mantenerlo, pero estaré encantado de ayudarte si lo necesitas.
