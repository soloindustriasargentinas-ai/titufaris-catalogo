# Solución Real y Definitiva: Subdominios Automáticos (*.titufaris.online)

Esta es la explicación técnica exacta de lo que ocurrió y las **dos soluciones reales y definitivas** para que cualquier tienda creada funcione al instante sin error 503 ni bloqueos de validación.

---

## 🔍 El Diagnóstico Real: ¿Por qué ocurrió esto?

1. **En Cloudflare:**
   - Creaste el registro DNS `*` apuntando a tu VPS con la nube naranja ☁️.
   - El candado SSL 🔒 funciona porque Cloudflare entrega el certificado Universal SSL para `*.titufaris.online`.
   - **Cloudflare está perfecto.**

2. **¿Por qué Coolify muestra "no available server" (HTTP 503)?**
   - Cuando alguien visita `https://zapas.titufaris.online`, Cloudflare le manda la petición a tu VPS con la cabecera `Host: zapas.titufaris.online`.
   - El proxy inverso de Coolify (Traefik) recibe la petición y busca en su tabla si existe alguna regla para `zapas.titufaris.online`.
   - Como en Coolify solo diste de alta `titufaris.online` y `tiendas.titufaris.online`, Traefik no sabe a quién entregarle la petición y devuelve:
     ```text
     503 Service Unavailable: no available server
     ```

3. **¿Por qué Coolify rechaza poner `*.titufaris.online` en el campo "Domains"?**
   - El formulario web de Coolify valida los dominios con una regla estricta de URL (`FILTER_VALIDATE_URL`). Al contener un asterisco `*`, el validador de Coolify lo rechaza diciendo *"The domains field must be a valid URL"*.
   - Por eso no se puede escribir comodines directamente en ese campo de Coolify.

---

## 🎯 Solución 1 (La más rápida, elegante y 100% automática): Cloudflare Worker

Esta solución toma **2 minutos**, es **100% gratuita para siempre** (Cloudflare incluye 100.000 peticiones por día sin costo) y **no requiere tocar ningún archivo de Linux ni de Coolify**.

### ¿Cómo funciona?
Cuando un cliente entra a `https://zapas.titufaris.online`:
1. El Worker recibe la solicitud.
2. Le pide la página a tu Coolify usando el dominio base `titufaris.online` (que Coolify ya conoce y acepta con 200 OK).
3. En el navegador del visitante la URL **permanece intacta**: `https://zapas.titufaris.online`.
4. El React en el navegador lee `window.location.hostname === 'zapas.titufaris.online'` y carga la tienda, logos, colores y productos de Zapas desde Firebase de inmediato.

### Paso a paso para implementarlo en Cloudflare:

1. Entra a tu panel de **Cloudflare** > Menú lateral izquierdo > **Workers y Pages** (o **Compute / Workers**).
2. Haz clic en **Create application** (Crear aplicación) > **Create Worker** (Crear Worker).
3. Ponle de nombre: `titufaris-subdominios`.
4. Haz clic en **Deploy** (Desplegar).
5. Haz clic en **Edit code** (Editar código).
6. Borra todo lo que haya y pega exactamente este código:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Si la petición es para un subdominio de titufaris.online (ej: zapas.titufaris.online)
    // se lo pedimos a Coolify con Host titufaris.online para que Traefik lo acepte sin 503
    if (url.hostname.endsWith('.titufaris.online') && 
        url.hostname !== 'titufaris.online' && 
        url.hostname !== 'tiendas.titufaris.online') {
      
      const newHeaders = new Headers(request.headers);
      newHeaders.set('Host', 'titufaris.online');
      newHeaders.set('X-Forwarded-Host', url.hostname);

      // Enviamos la petición al origen Coolify
      const originRequest = new Request(request.url, {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        redirect: 'follow'
      });

      return fetch(originRequest);
    }

    // Para el dominio raíz o tiendas, pasa directo
    return fetch(request);
  }
};
```

7. Haz clic en **Save and Deploy** (Guardar y desplegar).
8. Ahora ve a tu dominio en Cloudflare:
   - Haz clic en tu dominio **titufaris.online** > en el menú lateral izquierdo ve a **Workers Routes** (Rutas de Workers).
   - Haz clic en **Add route** (Agregar ruta).
   - En **Route** escribe:
     ```text
     *.titufaris.online/*
     ```
   - En **Worker** selecciona: `titufaris-subdominios`.
   - Haz clic en **Save** (Guardar).

¡Listo! A partir de este segundo, **cualquier subdominio que crees (ej: `zapas.titufaris.online`, `ropa.titufaris.online`) cargará al instante**, con candado SSL y sin ningún error de servidor.

---

## 🛠️ Solución 2 (Desde Coolify usando Docker Compose):

Si prefieres que la regla esté resuelta directamente en el servidor de Coolify:

Ya dejamos en el repositorio el archivo **`docker-compose.yml`** configurado con las etiquetas oficiales de Traefik para capturar comodines mediante expresión regular (`HostRegexp`):

```yaml
- "traefik.http.routers.titufaris-http.rule=Host(`titufaris.online`) || Host(`www.titufaris.online`) || Host(`tiendas.titufaris.online`) || HostRegexp(`^.+\\.titufaris\\.online$`)"
- "traefik.http.routers.titufaris-https.rule=Host(`titufaris.online`) || Host(`www.titufaris.online`) || Host(`tiendas.titufaris.online`) || HostRegexp(`^.+\\.titufaris\\.online$`)"
```

### Para activarlo en Coolify:
1. Sube los cambios a GitHub desde tu consola cmd (`git add .`, `git commit -m "Add wildcard compose"`, `git push origin main`).
2. En tu panel de **Coolify** > Tu Proyecto > Aplicación **Titufaris**:
3. En la pestaña **Configuration** > **General**:
   - Cambia **Build Pack** de *Dockerfile* a **Docker Compose**.
4. Haz clic en **Save** y luego en **Deploy**.
5. Traefik registrará la regla `HostRegexp` y aceptará cualquier subdominio directamente en el servidor.
