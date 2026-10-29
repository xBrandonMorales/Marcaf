
/* ==========================================
   MARCAF - PUBLICACIONES DESTACADAS
   Inicio: muestra 3 avisos desde Supabase
========================================== */

const URL_SUPABASE_INICIO =
    "https://rjlletybgreacibxhxug.supabase.co";

const CLAVE_SUPABASE_INICIO =
    "sb_publishable_1e-xFQXonPjjbmsc-2zd7g_BPBLkexv";

const supabaseInicio = window.supabase.createClient(
    URL_SUPABASE_INICIO,
    CLAVE_SUPABASE_INICIO
);

const contenedorPublicaciones =
    document.getElementById("publicacionesGrid");

function escaparTextoInicio(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function fechaPublicacionInicio(fecha) {
    if (!fecha) return "Publicación reciente";

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
        return "Publicación reciente";
    }

    return fechaConvertida.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function etiquetaPublicacionInicio(aviso) {
    if (aviso.destacado) return "Destacado";

    const etiquetas = {
        normal: "Aviso",
        media: "Novedades",
        alta: "Importante",
        urgente: "Urgente"
    };

    return etiquetas[aviso.importancia] || "Aviso";
}

function imagenValidaInicio(url) {
    if (!url) return "";

    try {
        const imagen = new URL(url);

        return ["https:", "http:"].includes(imagen.protocol)
            ? imagen.href
            : "";
    } catch {
        return "";
    }
}

function crearPublicacionInicio(aviso) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-publicacion";

    const imagen = imagenValidaInicio(aviso.imagen_url);
    const titulo = escaparTextoInicio(aviso.titulo);
    const descripcion = escaparTextoInicio(aviso.descripcion);
    const etiqueta = escaparTextoInicio(
        etiquetaPublicacionInicio(aviso)
    );
    const fecha = escaparTextoInicio(
        fechaPublicacionInicio(aviso.fecha_publicacion)
    );

    tarjeta.innerHTML = `
        <a href="pages/avisos.html">
            ${
                imagen
                    ? `<img
                        src="${escaparTextoInicio(imagen)}"
                        alt="${titulo}"
                        class="imagen-publicacion"
                        loading="lazy">`
                    : `<div class="imagen-publicacion imagen-sin-foto"
                        role="img"
                        aria-label="Aviso de MARCAF Carnes Selectas">
                        MARCAF
                       </div>`
            }
        </a>

        <div class="publicacion-contenido">
            <span class="etiqueta-publicacion">${etiqueta}</span>

            <p class="fecha-publicacion">${fecha}</p>

            <h3>${titulo}</h3>

            <p>${descripcion}</p>

            <a href="pages/avisos.html" class="enlace-publicacion">
                Ver más →
            </a>
        </div>
    `;

    return tarjeta;
}

async function cargarPublicacionesInicio() {
    if (!contenedorPublicaciones) return;

    try {
        const ahora = new Date().toISOString();

        const { data, error } = await supabaseInicio
            .from("avisos")
            .select(
                "id, titulo, descripcion, imagen_url, importancia, destacado, fecha_publicacion"
            )
            .eq("estado", "publicado")
            .lte("fecha_publicacion", ahora)
            .order("destacado", { ascending: false })
            .order("fecha_publicacion", { ascending: false })
            .limit(3);

        if (error) throw error;

        contenedorPublicaciones.replaceChildren();

        if (!data || data.length === 0) {
            const mensaje = document.createElement("p");
            mensaje.textContent =
                "Por el momento no hay publicaciones disponibles.";
            contenedorPublicaciones.appendChild(mensaje);
            return;
        }

        const fragmento = document.createDocumentFragment();

        data.forEach(aviso => {
            fragmento.appendChild(crearPublicacionInicio(aviso));
        });

        contenedorPublicaciones.appendChild(fragmento);

    } catch (error) {
        console.error(
            "Error al cargar publicaciones en Inicio:",
            error
        );

        contenedorPublicaciones.replaceChildren();

        const mensaje = document.createElement("p");
        mensaje.textContent =
            "No se pudieron cargar las publicaciones.";
        contenedorPublicaciones.appendChild(mensaje);
    }
}

document.addEventListener(
    "DOMContentLoaded",
    cargarPublicacionesInicio
);
