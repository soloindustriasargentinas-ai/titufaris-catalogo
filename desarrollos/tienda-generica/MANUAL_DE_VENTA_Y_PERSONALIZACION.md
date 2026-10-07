# 🚀 Manual de Producto, Venta y Personalización
## Solución Turnkey: E-Commerce Storefront + Catálogo Digital + Punto de Venta (POS)

¡Felicitaciones! Este paquete contiene una **solución digital completa y lista para comercializar** a comercios minoristas, mayoristas, distribuidores, fabricantes y locales de cualquier rubro (indumentaria, ferreterías, muebles, gastronomía, tecnología, repuestos, etc.).

---

## 💼 ¿Qué incluye esta solución? (Argumentos de venta)

1. **Tienda Online Pública (Storefront):**
   * Diseño responsive de alta conversión optimizado para celulares, tablets y PC.
   * Carrito de compras interactivo con cálculo automático de subtotales y descuentos mayoristas.
   * **Finalización de pedidos directa por WhatsApp:** el cliente envía su pedido formateado con detalle, SKU, precios y total a tu número en un clic.
   * **Enlaces propios por producto (`?p=SKU`):** comparte productos individuales en redes sociales con tarjeta de vista previa.

2. **Herramientas de Marketing y Redes Sociales:**
   * **Generador de Historias de Instagram:** crea banners verticales profesionales listos para publicar en Instagram Stories con foto, precio y llamado a la acción.
   * Botones de compartir en 1 clic para WhatsApp, Facebook, X (Twitter) y correo electrónico.
   * **Catálogo PDF descargable:** exporta listas de precios y catálogos visuales con fotos y códigos QR automáticos.

3. **Punto de Venta de Mostrador (POS):**
   * Cobro rápido con teclado táctil, lector de código de barras o búsqueda instantánea.
   * Múltiples medios de pago: Efectivo, Tarjeta de Crédito/Débito, Transferencia bancaria y **QR de Mercado Pago**.
   * Emisión e impresión de tickets / comprobantes de venta.
   * Control y descuento de stock en tiempo real con alertas de inventario bajo.

4. **Panel de Gestión Administrativa (Multi-Usuario con Roles):**
   * **Administrador:** acceso total a precios, stock, reportes, usuarios y configuración.
   * **Supervisor:** gestión de catálogo, precios y reportes.
   * **Cajero:** cobro en mostrador, arqueo y emisión de tickets.
   * **Vendedor:** consulta de stock, catálogo y atención a clientes.
   * Autenticación segura mediante PIN rápido de 4 dígitos o contraseña.

5. **Modo Híbrido (Offline-First + Cloud Sync):**
   * **Funciona sin internet:** gracias a IndexedDB y LocalStorage, nunca se detiene la venta en el local aunque se corte la conexión.
   * **Sincronización en la nube (Opcional):** conecta tu base de datos de Google Firebase en 2 minutos para sincronizar tablets, sucursales y celulares en tiempo real.
   * **Copias de Seguridad (Backup JSON):** descarga y restauración completa de todos los datos en 1 clic.

---

## 🎨 Cómo personalizar la tienda para un cliente (En 3 minutos)

El cliente o tú no necesitan tocar una sola línea de código para personalizar la tienda:

1. Entra a la web y haz clic en **"Acceso Personal / POS"** (icono de candado en la esquina superior derecha).
2. Ingresa con el usuario administrador:
   * **Usuario:** Administrador Principal
   * **PIN:** `1234` (o contraseña: `Admin1234!`)
3. Haz clic en el menú desplegable del administrador y selecciona **"Datos de la Empresa"**:
   * **Nombre comercial:** El nombre de la marca o local.
   * **Eslogan:** La frase o descripción corta.
   * **Logo:** URL del logo del cliente (o déjalo vacío para usar el isotipo moderno automático).
   * **Datos fiscales y legales:** Razón Social, CUIT/Tax ID, dirección física, ciudad, teléfono y email.
   * **Medios de Cobro:** Alias de Mercado Pago, link de pago directo, CBU y datos bancarios para transferencias.
   * **WhatsApp de Pedidos:** Número telefónico internacional (ej: `+54 9 11 ...`) donde ingresarán los pedidos del carrito.
4. Haz clic en **"Guardar Cambios"** y ¡listo! Toda la tienda, el membrete de los catálogos PDF y los tickets se actualizarán al instante.

---

## 📦 Gestión del Catálogo

* **Categorías:** Desde el menú del admin, pulsa **"Categorías"** para crear, renombrar o eliminar rubros a medida con sus iconos y colores.
* **Productos:** Pulsa **"+ Nuevo Producto"** para cargar artículos con múltiples fotos, precio minorista, precio mayorista, cantidad mínima de bulto, stock actual y especificaciones técnicas.
* **Copia de Respaldo:** En **"Copia de Seguridad"**, descarga el archivo `.json` de inicio del cliente para guardarlo como plantilla o restaurarlo cuando quieras.

---

## 🛠️ Cómo desplegar la tienda para un cliente

### Opción A: Despliegue en VPS propio con Coolify (Recomendado)
1. En el panel de Coolify, crea una nueva aplicación seleccionando tu repositorio Git.
2. Coolify detectará automáticamente el archivo `Dockerfile`.
3. Haz clic en **Deploy** y Coolify compilará y publicará la tienda con certificado HTTPS SSL automático.

### Opción B: Despliegue con Docker Compose (Cualquier servidor Linux)
En la carpeta del proyecto en el servidor, ejecuta:
```bash
docker compose up -d --build
```
La aplicación quedará corriendo en el puerto 80 con Nginx de alto rendimiento y compresión gzip activa.

### Opción C: Conectar Google Cloud Firestore (Para multi-dispositivo en tiempo real)
1. Crea un proyecto gratuito en [Firebase Console](https://console.firebase.google.com/).
2. Activa **Firestore Database** en modo de producción.
3. Copia las credenciales web de Firebase y pégalas en el archivo `firebase-applet-config.json`:
   ```json
   {
     "projectId": "tu-proyecto-id",
     "appId": "1:...",
     "apiKey": "AIzaSy...",
     "authDomain": "tu-proyecto-id.firebaseapp.com",
     "firestoreDatabaseId": "(default)"
   }
   ```
4. Aplica las reglas de seguridad incluidas en `firestore.rules`.
5. ¡Listo! Cualquier cambio realizado en el mostrador se reflejará al segundo en los celulares de los clientes y vendedores.

---

## 💰 Modelo de Monetización Sugerido

* **Setup inicial (Puesta en marcha):** $250 a $600 USD (incluye carga inicial del logo, configuración de medios de pago, dominio `.com` o `.com.ar` y carga de primeros 30 productos).
* **Abono mensual de hosting y soporte:** $25 a $50 USD / mes por comercio.
* **Servicio adicional de fotografía y diseño de historias:** $50 a $150 USD por lanzamiento de catálogo.
