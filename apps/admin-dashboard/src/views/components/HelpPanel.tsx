import { useState } from 'react';

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

const HELP_SECTIONS = [
  {
    id: 'catalog',
    title: '📦 Gestión de Catálogo',
    content: `
**Crear un prototipo:**
1. Ve a Catálogo → Clic en "+ Agregar prototipo"
2. Completa nombre, descripción, categoría, precio y stock
3. Guardar → El producto aparece en la landing inmediatamente (vía SSE)

**Editar:** Clic en "Editar" en cualquier fila para modificar campos.

**Desactivar:** Quita el producto del catálogo público sin eliminarlo. Puedes reactivarlo después.

**Imágenes:** Después de crear un prototipo, haz clic en "Editar" y usa la sección de subida de imágenes. Soporta: JPEG, PNG, WebP (máx 5MB).

**Importar Excel:** Puedes crear/actualizar múltiples prototipos a la vez subiendo un CSV. Usa el botón "Importar Excel" en la página del catálogo.
    `,
  },
  {
    id: 'orders',
    title: '🛒 Órdenes (Flujo A)',
    content: `
**Flujo:** Cliente paga → Se crea la orden → Tú revisas → Aceptar o Rechazar

**Aceptar:** Establece fecha estimada de entrega, descuenta stock, envía email de confirmación.

**Rechazar:** Genera reembolso automático vía PayPal, notifica al cliente.

**Importante:** El stock solo se descuenta cuando ACEPTAS. Si rechazas, no hay cambios de stock.

**Ver detalle:** Haz clic en "Ver" o en la fila para ver toda la información de la orden, incluyendo el producto comprado.
    `,
  },
  {
    id: 'quotes',
    title: '📋 Cotizaciones (Flujo B)',
    content: `
**Flujo:** Cliente solicita → Tú cotizas → Cliente acepta/rechaza → Pago

**Cotizar:** Clic en "Cotizar" para establecer precio y tiempo de producción. El cliente recibe un email con botones para aceptar o rechazar.

**Plazos:**
- El cliente tiene 48h para responder a tu cotización
- Si acepta, tiene 24h para pagar
- Las cotizaciones expiradas se marcan automáticamente

**Archivar:** Las cotizaciones rechazadas/expiradas se pueden archivar para mantener la lista limpia.

**Ver detalle:** Haz clic en "Ver" para leer la descripción completa del pedido del cliente.
    `,
  },
  {
    id: 'supplies',
    title: '🏗️ Suministros y Stock',
    content: `
**Alertas de stock bajo:** El sistema verifica cada hora. Si un suministro cae por debajo del mínimo, recibes una notificación (icono de campana + sonido).

**Importar Excel:** Sube una hoja de cálculo para actualizar cantidades en masa.

**Stock ≠ Suministros:** Stock son productos terminados (prototipos). Suministros son materias primas para fabricarlos.
    `,
  },
  {
    id: 'complaints',
    title: '📨 Reclamos y Reembolsos',
    content: `
**Flujo:** Cliente envía reclamo → Tú revisas → Aprobar reembolso O resolver sin reembolso

**Aprobar reembolso:** Genera reembolso automático vía PayPal. Se notifica al cliente.

**Resolver:** Marca como resuelto con una explicación. No se emite reembolso.

**Importante:** No puedes reembolsar un pago que ya fue reembolsado (protección de idempotencia).
    `,
  },
  {
    id: 'deliveries',
    title: '🚚 Entregas',
    content: `
**Programación:** Al aceptar una orden, la entrega se crea automáticamente basándose en la fecha estimada que estableciste.

**Actualización de estado:** Marca entregas como enviadas, en tránsito o entregadas.
    `,
  },
  {
    id: 'notifications',
    title: '🔔 Notificaciones',
    content: `
**Tiempo real:** Las notificaciones llegan vía WebSocket — escucharás un sonido y verás actualizarse el badge de la campana.

**Página completa:** Ve a Notificaciones en el menú lateral para ver el historial completo con búsqueda y paginación.

**Tipos:** Nuevas órdenes, nuevas cotizaciones, reclamos, alertas de stock bajo, pagos confirmados.

**Marcar como leída:** Clic en "Marcar leída" en cada notificación. El contador se actualiza en tiempo real.

**Sonido:** Puedes activar/desactivar el sonido de notificaciones desde el icono de campana.
    `,
  },
  {
    id: 'archived',
    title: '📂 Cotizaciones Archivadas',
    content: `
**Propósito:** Mantener limpia la tabla principal de cotizaciones moviendo las finalizadas al archivo.

**Acceso:** Menú lateral → Archivadas. Vista con búsqueda y paginación propia.

**Qué se puede archivar:** Cotizaciones rechazadas, expiradas o con pago expirado.

**Importante:** Archivar es permanente — la cotización sale de la tabla principal y solo se ve en Archivadas.
    `,
  },
  {
    id: 'settings',
    title: '⚙️ Configuración',
    content: `
**Acceso:** Menú lateral → Configuración.

**Funciones disponibles:**
- Gestión de cuenta del administrador
- Preferencias de notificación
- Información del sistema

**Registro de admins:** Solo un admin existente puede invitar a otro. El proceso es: invitación → verificación por email → creación de contraseña.
    `,
  },
  {
    id: 'search-pagination',
    title: '🔍 Búsqueda y Paginación',
    content: `
**Buscar:** Todas las tablas tienen un campo de búsqueda con filtrado en vivo (se activa después de dejar de escribir 300ms).

**Paginación:** Botones Anterior/Siguiente al pie de cada tabla. Se muestran desactivados cuando no hay más páginas.

**Filtros:** Cada tabla tiene filtros por estado que se combinan con la búsqueda de texto.

**Registros por página:** 20 registros por página en todas las tablas.
    `,
  },
];

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>('catalog');

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-elevated animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Panel de ayuda"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ayuda y Documentación</h2>
            <p className="text-xs text-gray-500">Cómo usar el panel de administración</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar panel de ayuda"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-2">
            {HELP_SECTIONS.map((section) => (
              <div key={section.id} className="rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50"
                  aria-expanded={expandedId === section.id}
                >
                  <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${expandedId === section.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedId === section.id && (
                  <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-3">
                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line text-xs leading-relaxed">
                      {section.content.trim()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick tips */}
          <div className="mt-8 rounded-xl bg-brand-50 p-4">
            <h3 className="text-sm font-semibold text-brand-800">💡 Tips rápidos</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-brand-700">
              <li>• Los cambios en el catálogo se reflejan en la landing en tiempo real</li>
              <li>
                • Todas las operaciones monetarias usan PayPal — los reembolsos son automáticos
              </li>
              <li>• Las notificaciones reproducen un sonido — verifica permisos del navegador</li>
              <li>• Rate limiting protege el login — 5 intentos cada 15 minutos</li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
