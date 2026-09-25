# Guía de Despliegue en Servidor Propio CentOS 7 con Dominio en DonWeb
**Dominio:** `titufaris.online`  
**Aplicación:** Titufaris - Tienda Web, Catálogo Digital & POS Tablet

---

## Índice
1. [Paso 1: Configurar los DNS en el panel de DonWeb](#paso-1-configurar-los-dns-en-el-panel-de-donweb)
2. [Paso 2: Preparar el servidor CentOS 7 (Nginx y Firewall)](#paso-2-preparar-el-servidor-centos-7-nginx-y-firewall)
3. [Paso 3: Subir los archivos de la aplicación](#paso-3-subir-los-archivos-de-la-aplicación)
4. [Paso 4: Configurar el VirtualHost en Nginx con soporte SPA](#paso-4-configurar-el-virtualhost-en-nginx-con-soporte-spa)
5. [Paso 5: Instalar Certificado SSL Gratuito HTTPS (Let's Encrypt)](#paso-5-instalar-certificado-ssl-gratuito-https-lets-encrypt)
6. [Paso 6: Comprobación y Renovación Automática](#paso-6-comprobación-y-renovación-automática)

---

## Paso 1: Configurar los DNS en el panel de DonWeb

Para que el dominio `titufaris.online` apunte a tu servidor CentOS 7:

1. Ingresa a tu panel de cliente en **DonWeb** ([donweb.com](https://donweb.com)).
2. Ve a **Mis Servicios > Dominios** y selecciona **titufaris.online**.
3. Ingresa a la sección **Zona DNS** (o *Administración de Registros DNS*).
4. Configura los siguientes dos registros:

| Tipo | Nombre / Host | Valor / Destino | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (o en blanco) | `LA_IP_PUBLICA_DE_TU_CENTOS` (Ej: `181.xxx.xxx.xxx`) | 14400 |
| **A** o **CNAME** | `www` | `LA_IP_PUBLICA_DE_TU_CENTOS` (o CNAME a `titufaris.online`) | 14400 |

> ⏳ *Nota*: La propagación de los DNS suele tardar entre 15 minutos y un par de horas.

---

## Paso 2: Preparar el servidor CentOS 7 (Nginx y Firewall)

Conéctate por SSH a tu servidor CentOS 7 como usuario `root` o con privilegios `sudo`:
```bash
ssh root@IP_DE_TU_SERVIDOR
```

### 1. Actualizar el sistema e instalar el repositorio EPEL
```bash
yum update -y
yum install epel-release -y
```

### 2. Instalar el servidor web Nginx
Nginx es el servidor web más rápido y eficiente para servir aplicaciones React con Vite:
```bash
yum install nginx -y
systemctl enable nginx
systemctl start nginx
```

### 3. Abrir los puertos 80 (HTTP) y 443 (HTTPS) en el Firewall
```bash
firewall-cmd --permanent --zone=public --add-service=http
firewall-cmd --permanent --zone=public --add-service=https
firewall-cmd --reload
```

---

## Paso 3: Subir los archivos de la aplicación

La aplicación compilada consiste en los archivos estáticos dentro de la carpeta `dist/` (HTML, JS, CSS, iconos y fuentes).

### Opción A: Compilar en tu PC y subir la carpeta `dist` por SCP (Recomendada)
1. En tu computadora, exporta el proyecto desde AI Studio (menú > Exportar ZIP) y abre la carpeta.
2. Compila la aplicación para producción:
   ```bash
   npm install
   npm run build
   ```
3. Sube la carpeta `dist` directamente a tu servidor CentOS 7:
   ```bash
   scp -r dist/* root@IP_DE_TU_SERVIDOR:/var/www/titufaris/
   ```

### Opción B: Compilar directamente dentro de tu servidor CentOS 7
Si prefieres tener Node.js instalado en el CentOS 7:
```bash
# 1. Instalar Node.js 20 LTS en CentOS 7
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs git

# 2. Crear el directorio de la aplicación
mkdir -p /var/www/titufaris

# 3. Copiar el código del proyecto a /var/www/titufaris y ejecutar:
cd /var/www/titufaris
npm install
npm run build
```
Los archivos finales quedarán en `/var/www/titufaris/dist`.

### Configurar permisos de lectura para Nginx y SELinux
```bash
chown -R nginx:nginx /var/www/titufaris
chmod -R 755 /var/www/titufaris

# Si tienes SELinux activo (común en CentOS):
chcon -Rt httpd_sys_content_t /var/www/titufaris
```

---

## Paso 4: Configurar el VirtualHost en Nginx con soporte SPA

Crea el archivo de configuración para `titufaris.online`:
```bash
nano /etc/nginx/conf.d/titufaris.conf
```

Pega la siguiente configuración optimizada (incluye compresión Gzip para que el catálogo cargue instantáneamente y redirección de rutas SPA):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name titufaris.online www.titufaris.online;

    root /var/www/titufaris/dist;
    index index.html;

    # Compresión Gzip para velocidad máxima
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript image/svg+xml;
    gzip_disable "MSIE [1-6]\.";

    location / {
        # Regla esencial para React SPA:
        # Si un archivo no existe físicamente, redirige a index.html
        try_files $uri $uri/ /index.html;
    }

    # Caché para imágenes, fuentes y scripts
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    error_log /var/log/nginx/titufaris_error.log;
    access_log /var/log/nginx/titufaris_access.log;
}
```

Verifica que la sintaxis de Nginx sea correcta y reinicia el servicio:
```bash
nginx -t
systemctl reload nginx
```

---

## Paso 5: Instalar Certificado SSL Gratuito HTTPS (Let's Encrypt)

Para que tu sitio tenga el candado verde de seguridad `https://` y no muestre advertencias al pagar o navegar:

### 1. Instalar Certbot para Nginx en CentOS 7
```bash
yum install certbot python2-certbot-nginx -y
```

### 2. Generar el certificado SSL automáticamente
*(Asegúrate de que los DNS de DonWeb ya hayan propagado antes de ejecutar esto)*:
```bash
certbot --nginx -d titufaris.online -d www.titufaris.online
```

- Te pedirá tu correo electrónico (puedes ingresar `soloindustriasargentinas@gmail.com`).
- Acepta los términos y condiciones (`Y`).
- Cuando te pregunte si deseas redirigir todo el tráfico HTTP a HTTPS de manera forzada, selecciona la opción **2 (Redirect)**.

¡Certbot modificará automáticamente tu archivo de Nginx para activar HTTPS y la renovación automática!

---

## Paso 6: Comprobación y Renovación Automática

1. Abre tu navegador web e ingresa a:  
   👉 **`https://titufaris.online`**
2. Verás la **Tienda Web Oficial de Titufaris**, con:
   - Certificado SSL válido y seguro.
   - Catálogo de góndolas, refrigeración, balanzas y checkouts.
   - Carrito de compras y botón directo de pedidos por WhatsApp.
   - Botón de acceso al Panel POS / Terminal para tu personal.
3. Para asegurar la renovación automática del certificado cada 90 días, verifica el cron:
   ```bash
   certbot renew --dry-run
   ```
   Si responde `Congratulations, all simulated renewals succeeded`, todo está listo y no tendrás que renovarlo manualmente nunca.
