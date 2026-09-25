# Titufaris — Manual de Instrucciones y Guía del Modo Prueba

Bienvenido al entorno de prueba de **Titufaris**, el sistema integral de catálogo digital, lista de precios exportable a PDF, códigos QR dinámicos, control de inventario offline-first y terminal de cobro POS para tablets.

Este documento detalla paso a paso cómo probar cada funcionalidad del sistema con los datos de demostración incluidos.

---

## 1. Acceso y Dispositivos Soportados

- **URL de Desarrollo / Acceso**: Disponible en el navegador de su PC, notebook, iPad o tablet Android.
- **Optimización para Tablets**: Todos los botones de acción, teclados y controles cuentan con áreas táctiles superiores a 44 px para facilitar el uso con los dedos en salón de ventas o mostrador.
- **Sin Instalación Obligatoria**: Funciona en cualquier navegador web moderno (Chrome, Safari, Edge, Firefox).

---

## 2. Usuarios de Prueba Preconfigurados

Para probar el control de acceso multiusuario y la matriz de permisos, el sistema incluye 4 usuarios con roles diferentes:

| Usuario | Rol | Permisos Principales |
| :--- | :--- | :--- |
| **Martín Titufaris** | `Administrador Total` | Acceso completo: precios, stock, ventas, reportes, usuarios y configuración de empresa. |
| **Carolina Méndez** | `Supervisora` | Modificación de precios mayoristas/minoristas y control de inventario. |
| **Lucas Varela** | `Vendedor` | Consultas de catálogo, emisión de presupuestos y exportación de listas. |
| **Sofía Benítez** | `Cajera POS` | Acceso enfocado a la terminal de cobro y registro de tickets de venta. |

> **Cómo cambiar de usuario para probar permisos**:
> 1. Haga clic en el avatar del usuario o en el ícono de usuarios (`👥`) en la barra superior.
> 2. Seleccione **"Cambiar a este usuario"** en cualquiera de los perfiles.
> 3. Observe cómo la interfaz oculta o muestra botones (como editar precios, ajustar inventario o ver reportes) según los permisos asignados.

---

## 3. Guía Paso a Paso para el Modo Prueba

### Prueba 1: Catálogo y Conmutador de Precios (Minorista vs. Mayorista)
1. Ingrese a la pestaña **"Catálogo"** en la barra de navegación superior.
2. En la barra de herramientas, haga clic en los botones **"PVP Minorista"** y **"Mayorista"**:
   - Al cambiar, todos los precios de las tarjetas y listas se actualizan instantáneamente.
3. Filtre por categorías tocando las pastillas horizontales: *Góndolas y Racks, Refrigeración Comercial, Balanzas Digitales, Checkouts, Maquinaria*.
4. Use el buscador para tipear `báscula`, `heladera` o el SKU `GND-CENT-120`.
5. Cambie entre la **Vista en Grilla** y la **Vista en Lista** usando los íconos junto al selector de stock.

---

### Prueba 2: Ajuste Rápido de Stock y Alertas en Tiempo Real
1. En cualquier tarjeta de producto, utilice los botones `+` y `-` ubicados junto al botón de venta.
2. Disminuya el stock de un producto hasta que sea igual o menor a su stock mínimo (por ejemplo, menos de 3 unidades).
3. **Resultado esperado**:
   - Sonará una alerta sonora de precaución.
   - La tarjeta mostrará una insignia naranja de **"Bajo Stock"**.
   - Se disparará una **notificación push** en la campanita superior (`🔔`).
   - Quedará registrado en el historial de auditoría el ajuste con nombre del usuario y fecha/hora.

---

### Prueba 3: Códigos QR Dinámicos para Productos y Fichas Técnicas
1. En cualquier producto, haga clic en el botón con el ícono de **Código QR** (`📱`).
2. Se abrirá el modal interactivo con el QR generado en alta resolución con el logo de Titufaris.
3. **Acciones para probar**:
   - **Escanear con su celular**: Apunte la cámara de su teléfono al QR de la pantalla; abrirá el enlace directo a la ficha técnica del producto (`?id=...`).
   - **Descargar QR**: Descarga la imagen PNG lista para catálogos digitales o folletos.
   - **Imprimir Etiqueta**: Genera la etiqueta individual de góndola con código de barras y QR para estanterías.
   - **Ver Ficha Técnica Completa**: Muestra dimensiones, potencia, capacidad de carga, materiales y garantía oficial.

---

### Prueba 4: Generación y Exportación de Documentos (PDF y Excel)
1. En la barra superior, presione el botón **"Exportar PDF"** (`📥`).
2. Seleccione el formato que desea emitir:
   - **Catálogo Visual en PDF**: Formato presentación con membrete de Titufaris, fotos, especificaciones técnicas y códigos QR escaneables.
   - **Lista de Precios B2B**: Tabla apaisada con columnas de precios mayorista, minorista y código SKU.
   - **Etiquetas con QR para Góndola**: Cuadrícula de etiquetas troqueladas listas para imprimir.
   - **Exportar CSV / Excel**: Planilla descargable compatible con Microsoft Excel y Google Sheets.
3. Personalice las casillas de verificación (incluir precios, costos internos, fichas técnicas o filtrar por categorías específicas).
4. Haga clic en **"Descargar PDF Oficial"** y abra el archivo descargado para verificar el membrete corporativo y la nitidez de impresión.

---

### Prueba 5: Terminal de Ventas POS para Tablet y Pasarela de Cobro
1. En la barra superior, seleccione la pestaña **"POS Tablet"**.
2. **Cargar artículos al ticket**:
   - Toque cualquier producto de la grilla táctil o use el botón **"Escanear"** para simular una lectura de código de barras con sonido de confirmación.
   - En el panel derecho (Ticket en curso), aumente o disminuya cantidades con los botones táctiles de 44 px.
3. **Aplicar Descuentos Comerciales**:
   - Toque los botones de descuento rápido (`-5%`, `-10%`, `-15%`). Verá cómo el subtotal y el total se recalculan en vivo.
4. **Presionar "Cobrar Venta"**:
   - Se abrirá la **Pasarela de Cobro Integrada**. Pruebe cualquiera de los 4 medios de pago:
     * **QR Mercado Pago / MODO**: Muestra el código QR para transferencias interoperables 3.0.
     * **Tarjeta de Crédito / Débito**: Permite elegir cuotas fijas (1 pago, 3 o 6 cuotas) con cálculo de cuota mensual.
     * **Transferencia Bancaria**: Muestra el CBU, Alias (`TITUFARIS.EQUIPAMIENTO`) y campo para el número de comprobante.
     * **Efectivo**: Ingrese el monto recibido y el sistema calculará automáticamente el vuelto exacto a entregar.
5. Haga clic en **"Confirmar Venta"**:
   - Sonará el repique sonoro de confirmación.
   - Se descontará automáticamente el stock del inventario.
   - Podrá presionar **"Imprimir Ticket"** para generar el comprobante fiscal/remito de Titufaris.

---

### Prueba 6: Modo Offline (Sin Conexión a Internet) y Sincronización
1. En el banner superior de conectividad, haga clic en el botón **"Simular Modo Offline"**.
2. **Estado**: El banner cambiará a color ámbar indicando *"Modo Offline Activado - Trabajando con almacenamiento local"*.
3. Mientras esté desconectado:
   - Realice ventas en el POS.
   - Modifique precios o cambie el stock de los productos.
   - Cree un nuevo producto desde el botón **"+ Nuevo"**.
4. Observe cómo el contador de operaciones pendientes de sincronizar (`syncQueue`) va aumentando (ej. *3 cambios pendientes*).
5. Haga clic en **"Restablecer Conexión"** o **"Sincronizar ahora"**:
   - El sistema se conectará en segundo plano, enviará los cambios acumulados y emitirá una notificación de *"Sincronización en la Nube Completa"*.

---

### Prueba 7: Auditoría y Reportes de Actividad
1. Seleccione la pestaña **"Auditoría"** en la barra de navegación.
2. Examine los paneles superiores de métricas:
   - **Valuación de Inventario (PVP)**: Suma total de los productos a precio de venta minorista.
   - **Costo Base**: Valuación a costo de fábrica.
   - **Unidades en Depósito**: Total de piezas físicas en existencia.
   - **Alertas de Stock**: Cantidad de productos en nivel crítico.
   - **Ventas Registradas**: Recaudación acumulada.
3. Revise la lista de eventos: cada cambio de precio, ajuste de inventario, venta o exportación figura con el usuario responsable, fecha, hora y detalle exacto.

---

### Prueba 8: Configuración de Datos de Empresa
1. Haga clic en el ícono de engranaje (`⚙️`) en la barra superior.
2. Modifique la Razón Social, CUIT, Teléfono, Dirección o los datos bancarios (Banco, Alias, CBU).
3. Modifique el texto de "Condiciones Comerciales y Garantía" que sale al pie de los catálogos en PDF.
4. Presione **"Guardar Configuración"**: todos los próximos PDFs, etiquetas y comprobantes emitidos adoptarán la nueva información.

---

### Prueba 9: Tienda Web Pública para Clientes (E-Commerce B2B/B2C)
1. Ingrese a la tienda pública con el botón **"Ver Tienda"** en la barra superior o en el botón flotante inferior **"Panel POS / Admin"**.
2. **Experiencia del cliente**:
   - Encabezado con logo oficial de Titufaris, buscador de equipamiento y acceso directo a WhatsApp.
   - Hero banner comercial con catálogo de líneas destacadas (*Góndolas, Refrigeración, Checkouts, Balanzas*).
   - Ocultamiento de costos de fabricación y botones de administración interna (diseño limpio y enfocado a ventas).
   - Botón **"WhatsApp"** en cada producto para iniciar una consulta directa con el vendedor con los datos del artículo ya redactados.
3. **Carrito de Compras y Pedidos**:
   - Agregue artículos con el botón **"Comprar"** y abra el carrito desde la esquina superior derecha.
   - Ajuste las cantidades con los botones `+` y `-`.
   - Seleccione la modalidad de entrega (*Envío a coordinar* o *Retiro en fábrica*).
   - **Opción A - Pedir Presupuesto por WhatsApp**: Al presionar el botón verde se generará un mensaje automático con los productos, cantidades, precios y total calculado para enviar a fábrica.
   - **Opción B - Pagar Online**: Presione el botón naranja para abrir la pasarela integrada y abonar con **QR Mercado Pago / MODO**, tarjeta o transferencia.
4. **Regreso al Panel Interno**:
   - Toque el botón **"Acceso Personal / POS"** en la barra superior o el botón flotante inferior para volver a la terminal de empleados.

---

## 4. Estructura de Archivos del Proyecto

Si el equipo de desarrollo necesita inspeccionar o extender el código fuente:

```
/
├── desarrollos/
│   └── INSTRUCCIONES_MODO_PRUEBA.md      <-- Este manual de prueba
├── src/
│   ├── components/
│   │   ├── TitufarisLogo.tsx            <-- Logo oficial horizontal
│   │   ├── Navbar.tsx                   <-- Barra de navegación y perfil
│   │   ├── ProductCard.tsx              <-- Tarjeta con touch 44px y QR
│   │   ├── ProductDetailModal.tsx       <-- Ficha técnica completa
│   │   ├── ProductFormModal.tsx         <-- Alta y edición de productos
│   │   ├── QRCodeModal.tsx              <-- Generador de QR dinámico y etiquetas
│   │   ├── POSView.tsx                  <-- Terminal de venta para tablet
│   │   ├── PaymentModal.tsx             <-- Pasarela de pago (QR, tarjeta, efectivo)
│   │   ├── ExportModal.tsx              <-- Generador de catálogo PDF y Excel
│   │   ├── AdminUsersModal.tsx          <-- Matriz de roles y permisos
│   │   ├── ActivityReportsView.tsx      <-- Reportes de auditoría y métricas
│   │   ├── CompanySettingsModal.tsx     <-- Configuración fiscal y bancaria
│   │   ├── NotificationsDrawer.tsx      <-- Notificaciones push de stock
│   │   └── OfflineBanner.tsx            <-- Control offline y sincronización
│   ├── data/
│   │   └── initialData.ts               <-- Datos precargados de demostración
│   ├── types/
│   │   └── index.ts                     <-- Interfaces TypeScript
│   ├── utils/
│   │   ├── storage.ts                   <-- Persistencia local y cola de sync
│   │   ├── qrCode.ts                    <-- Motor de generación de códigos QR
│   │   ├── pdfExport.ts                 <-- Motor de exportación jsPDF
│   │   └── audio.ts                     <-- Feedback sonoro Web Audio API
│   ├── App.tsx                          <-- Componente raíz integrador
│   └── index.css                        <-- Estilos Tailwind v4 y tipografía
```

---

## 5. Preguntas Frecuentes en Modo Prueba

- **¿Se pierden los datos si recargo la página?**
  No. Todos los productos, precios, ventas y usuarios se guardan en el almacenamiento local persistente del navegador (`localStorage`).
- **¿Cómo puedo restaurar los datos iniciales de fábrica?**
  Si desea reiniciar los productos y ventas a su estado original, abra la consola del navegador (`F12`), ejecute `localStorage.clear()` y recargue la página (`F5`).
- **¿Puedo escanear los QR con cualquier celular?**
  Sí. Cualquier teléfono con lector de código QR en su cámara puede leer los códigos generados y abrir la ficha del producto.
