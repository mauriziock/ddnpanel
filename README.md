# DDNPANEL

Un panel de control moderno con interfaz tipo sistema operativo construido con Next.js, diseñado para la gestión de archivos, medios y herramientas de sistema en entornos locales o servidores personales.

## Caracteristicas

- Interfaz Multi-ventana: Sistema de ventanas arrastrables, redimensionables y minimizables (WindowManager).
- Gestion de Archivos: Explorador completo con soporte para navegacion de carpetas, carga/descarga de archivos, previsualizacion de medios y editor de texto.
- Catalogo de Iconos: Integracion completa con Simple Icons para personalizar accesos directos.
- Deteccion de Discos: Capacidad de interactuar con unidades USB y discos montados en el host.
- Dock Dinamico: Gestion de aplicaciones y ventanas con indicadores visuales.
- Personalizacion: Cambio de temas, seleccion de wallpapers y soporte multi-idioma (Español/Ingles).
- Docker Ready: Optimizacion para despliegues con gestion de permisos (PUID/PGID) y persistencia.

## Despliegue con Docker (Recomendado)

La forma mas sencilla de utilizar DDNPANEL es a traves de su imagen oficial en Docker Hub. No necesitas clonar el codigo fuente ni instalar dependencias de desarrollo.

### 1. Docker Compose

Crea un archivo llamado `docker-compose.yml` con el siguiente contenido:

```yaml
services:
  panel:
    image: mauriziock/ddnpanel:latest
    container_name: ddnpanel
    restart: always
    ports:
      - "3000:3000"
    environment:
      - PUID=1000
      - PGID=1000
      - AUTH_SECRET=una_clave_aleatoria_de_32_caracteres
      - AUTH_TRUST_HOST=true
    volumes:
      - ./config:/app/config
      - ./files-storage:/app/files-storage
      - ./wallpapers:/app/public/wallpapers
      - /media:/media
      - /mnt:/mnt
    privileged: true
```

### 2. Ejecucion

Desde la terminal, en la misma carpeta donde creaste el archivo, ejecuta:

```bash
docker compose up -d
```

Accede a traves de `http://localhost:3000`.

### Credenciales por Defecto
- Usuario: admin
- Contraseña: admin

## Variables de Entorno

| Variable | Descripcion | Requerido |
|----------|-------------|-----------|
| AUTH_SECRET | Clave para cifrar sesiones. Generar con `openssl rand -base64 32` | Si |
| PUID | ID de usuario del host para permisos de archivos | No (Default: 1000) |
| PGID | ID de grupo del host para permisos de archivos | No (Default: 1000) |
| AUTH_TRUST_HOST | Debe ser `true` si se usa detras de un proxy | No (Default: true) |
| NEXTAUTH_URL | URL publica de la aplicacion (necesario en algunos proxys) | No |

## Construccion desde el Codigo Fuente

Si prefieres compilar la imagen tu mismo o realizar modificaciones:

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/mauriziock/ddnpanel.git
   cd ddnpanel
   ```

2. Construir la imagen localmente:
   ```bash
   docker build -t ddnpanel:local ./panel
   ```

3. Modificar el `docker-compose.yml` para usar `image: ddnpanel:local`.

## Mantenimiento y Seguridad

### Restablecimiento de Contraseña
Si pierdes el acceso, puedes resetear cualquier contraseña desde el host:
```bash
docker exec -it ddnpanel node scripts/reset-password.js <usuario> <nueva_contraseña>
```

### Gestion de Permisos
El contenedor utiliza un script de entrada que ajusta automaticamente los permisos para que coincidan con tu usuario de host (vía PUID/PGID), evitando errores de lectura/escritura en volumenes montados.

## Licencia

Este proyecto esta bajo la licencia MIT.

Aviso Legal: El diseño visual esta inspirado en interfaces modernas, pero no utiliza codigo, recursos graficos o marcas registradas propiedad de terceros. Todos los graficos son generados mediante codigo o librerias de codigo abierto (Lucide React, Simple Icons).

Este es un proyecto personal. Sientete libre de compartirlo, modificarlo y usarlo como desees.
