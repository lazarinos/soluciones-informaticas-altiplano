# Sistema de Diseño y Tokens: Soluciones Informáticas del Altiplano

## 1. Filosofía Visual

La identidad visual está concebida para una empresa de servicios de ingeniería y tecnología en Juliaca:
- **Tono:** Confiable, técnico, sobrio, contemporáneo y accesible.
- **Atmósfera:** Paleta corporativa tecnológica con azul zafiro oscuro (`#0F172A`), azul cobalto tecnológico (`#2563EB`) y acentos en verde esmeralda (`#10B981`) que denotan seguridad, estabilidad y operatividad activa.

---

## 2. Tokens de Color (CSS Custom Properties)

```css
:root {
  /* Marca Primaria */
  --color-primary: #1E40AF;          /* Azul corporativo profundo */
  --color-primary-hover: #1D4ED8;    /* Azul activo / hover */
  --color-primary-light: #EFF6FF;    /* Fondo tintado azul */

  /* Marca Secundaria y Acento */
  --color-accent: #0284C7;           /* Cyan tecnológico / Redes */
  --color-success: #059669;          /* Verde operatividad / Uptime */
  --color-success-light: #ECFDF5;

  /* Superficies y Neutros */
  --color-bg-body: #F8FAFC;          /* Gris slate ultra suave para descanso visual */
  --color-bg-surface: #FFFFFF;       /* Blanco puro para tarjetas */
  --color-bg-alt: #F1F5F9;           /* Gris sutil para secciones alternadas */
  --color-bg-dark: #0F172A;          /* Navy medianoche para hero/footer */

  /* Texto y Jerarquía */
  --color-text-main: #0F172A;        /* Slate 900 (máximo contraste WCAG AAA) */
  --color-text-muted: #475569;       /* Slate 600 (legibilidad de lectura) */
  --color-text-light: #94A3B8;       /* Slate 400 (metadatos y subtítulos) */
  --color-text-inverse: #FFFFFF;     /* Texto sobre fondos oscuros */

  /* Bordes y Líneas */
  --color-border: #E2E8F0;           /* Bordes suaves */
  --color-border-hover: #93C5FD;     /* Borde iluminado en foco/hover */

  /* Sombras y Elevaciones */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
  --shadow-glow: 0 0 20px rgba(37, 99, 235, 0.15);

  /* Espaciado y Layout */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --max-width: 1200px;

  /* Motion Tokens */
  --motion-fast: 150ms;
  --motion-base: 250ms;
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

---

## 3. Escala Tipográfica Fluida

Se utiliza un stack tipográfico nativo de alta legibilidad (`system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`), eliminando la necesidad de descargas externas de fuentes para garantizar carga instantánea (LCP < 0.5s):

| Nivel | Tamaño Fluid (`clamp`) | Peso | Uso |
| :--- | :--- | :--- | :--- |
| **Display H1** | `clamp(2rem, 5vw, 3.25rem)` | 800 (Bold) | Titular principal del Hero |
| **Heading H2** | `clamp(1.75rem, 3.5vw, 2.25rem)` | 700 (Bold) | Títulos de sección (Nosotros, Servicios, Contacto) |
| **Heading H3** | `1.25rem (20px)` | 600 (Semi-bold) | Títulos de tarjetas de servicios y pilares |
| **Body Large** | `1.125rem (18px)` | 400 (Regular) | Párrafos introductorios y subtítulos destacados |
| **Body Regular** | `1rem (16px)` | 400 (Regular) | Textos informativos de lectura |
| **Small / Badge**| `0.875rem (14px)` | 600 (Semi-bold) | Badges de contexto, metadatos y labels |

---

## 4. Componentes UI Clave

1. **Botones de Alta Conversión:**
   - Botón Primario: Fondo azul `#1E40AF`, texto blanco, microelevación al hover (`translateY(-2px)`), foco accesible con anillo de 3px.
   - Botón Secundario: Borde slate, fondo transparente o blanco, cambio sutil de superficie.
   - Botón WhatsApp: Verde esmeralda `#059669` con isotipo oficial, enlace dinámico con mensaje pre-rellenado.
2. **Tarjetas de Servicios TIC (4 tarjetas):**
   - Elevación suave, borde de 1px `#E2E8F0`, padding generoso (32px), icono vectorial en contenedor redondeado, lista de especificaciones técnicas y microinteracción de elevación al hover.
3. **Métricas de Confianza:**
   - Cifras en fuente grande (32px bold) con etiquetas descriptivas debajo (Años de trayectoria, Disponibilidad, Soporte presencial).
4. **Formulario de Contacto:**
   - Campos amplios, placeholder legible, etiquetas explícitas flotantes o fijas, foco resaltado con borde azul y feedback interactivo tras el envío sin recarga de página.

