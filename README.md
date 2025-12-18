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

1. Clona el repositorio:
   ```bash
   git clone https://github.com/mauriziock/ddnpanel.git
   cd ddnpanel
   ```

2. Ejecuta el contenedor:
   ```bash
   docker-compose up -d --build
   ```

3. Accede en: `http://localhost:3000`

### Credenciales por Defecto
- **Usuario**: `admin`
- **Contraseña**: `admin`

## Administración y Seguridad

### Restablecimiento de Contraseña
Si pierdes el acceso, puedes usar la herramienta integrada vía terminal:
```bash
docker exec -it controlpanel node scripts/reset-password.js <usuario> <nueva_contraseña>
```

### Gestión de Permisos (PUID/PGID)
Para evitar problemas de escritura en discos externos o carpetas locales, el contenedor usa mapeo de usuario. Por defecto es `1000:1000`. Puedes cambiarlo en el `docker-compose.yml`.

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
