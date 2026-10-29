/* ==========================================
   MARCAF CARNES SELECTAS
   Carga de avisos desde Supabase
========================================== */
// Conexion a Supabase

const SUPABASE_URL = "https://rjlletybgreacibxhxug.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbGxldHliZ3JlYWNpYnhoeHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyODA2ODIsImV4cCI6MjEwODg1NjY4Mn0.wFp3s0xtTWUwYy1Ybi96u50935Rfl9gWOleJHn5Fbjg";


const clienteSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Logo que se usa como "foto de perfil" en cada publicación
const LOGO_MARCAF = "../images/Logo.jpg";

// Cantidad de caracteres a partir de la cual se muestra "ver más"
const LIMITE_DESCRIPCION = 160;

// Elementos de la página
const listaAvisos = document.getElementById("listaAvisos");
const mensajeAvisos = document.getElementById("mensajeAvisos");

// Evita que el contenido de los avisos se interprete como HTML
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// Formatea la fecha para mostrarla en español
function formatearFecha(fecha) {
    if (!fecha) return "Fecha no disponible";

    return new Date(fecha).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// Traduce el nivel de importancia para mostrarlo al visitante
function textoImportancia(importancia) {
    const etiquetas = {
        normal: "Aviso",
        media: "Importancia media",
        alta: "Importante",
        urgente: "Urgente"
    };

    return etiquetas[importancia] || "Aviso";
}

// Solo permite direcciones de imagen HTTP o HTTPS
function obtenerImagenSegura(url) {
    if (!url) return "";

    try {
        const direccion = new URL(url);

        if (!["https:", "http:"].includes(direccion.protocol)) {
            return "";
        }

        return direccion.href;
    } catch {
        return "";
    }
}

// ==========================================
// VISOR DE PUBLICACIÓN (estilo Instagram)
// ==========================================
const visorAviso = document.getElementById("visorAviso");
const visorContenido = document.getElementById("visorContenido");
const cerrarVisor = document.getElementById("cerrarVisor");

// Da formato a la descripción del visor: los renglones que empiezan
// con "-" o "•" se muestran como lista; el resto, como párrafos.
function formatearDescripcion(texto) {
    const lineas = String(texto ?? "").split(/\r?\n/);
    let html = "";
    let items = [];

    const cerrarLista = () => {
        if (items.length) {
            html += `<ul class="visor-lista">${items.join("")}</ul>`;
            items = [];
        }
    };

    lineas.forEach(linea => {
        const limpia = linea.trim();

        if (!limpia) {
            cerrarLista();
            return;
        }

        const item = limpia.match(/^[-•*]\s*(.+)$/);

        if (item) {
            items.push(`<li>${escaparHTML(item[1])}</li>`);
        } else {
            cerrarLista();
            html += `<p>${escaparHTML(limpia)}</p>`;
        }
    });

    cerrarLista();

    return html;
}

// Abre la publicación completa: imagen a la izquierda, texto a la derecha
function abrirVisor(aviso, imagen) {
    if (!visorAviso || !visorContenido) return;

    visorContenido.innerHTML = `
        <div class="visor-imagen">
            <img src="${escaparHTML(imagen)}"
                 alt="${escaparHTML(aviso.titulo)}">
        </div>

        <div class="visor-panel">
            <div class="visor-cabecera">
                <div class="aviso-avatar">
                    <img src="${escaparHTML(LOGO_MARCAF)}" alt="MARCAF">
                </div>

                <div class="aviso-autor">
                    <strong>MARCAF Carnes Selectas</strong>
                </div>

                ${aviso.destacado ? `
                    <span class="etiqueta destacado-etiqueta aviso-fijado">
                        ★ Destacado
                    </span>
                ` : ""}
            </div>

            <div class="visor-cuerpo">
                <span class="etiqueta ${escaparHTML(aviso.importancia)}">
                    ${escaparHTML(textoImportancia(aviso.importancia))}
                </span>

                <h2>${escaparHTML(aviso.titulo)}</h2>

                <div class="visor-descripcion">${formatearDescripcion(aviso.descripcion)}</div>
            </div>

            <div class="visor-pie">
                ${escaparHTML(formatearFecha(aviso.fecha_publicacion))}
            </div>
        </div>
    `;

    visorAviso.showModal();
    document.body.style.overflow = "hidden";
}

if (visorAviso) {
    // Botón X
    if (cerrarVisor) {
        cerrarVisor.addEventListener("click", () => visorAviso.close());
    }

    // Clic fuera de la publicación (en el fondo oscuro)
    visorAviso.addEventListener("click", event => {
        if (event.target === visorAviso) visorAviso.close();
    });

    // Al cerrar (X, fondo o tecla Esc) se limpia y se devuelve el scroll
    visorAviso.addEventListener("close", () => {
        document.body.style.overflow = "";
        visorContenido?.replaceChildren();
    });
}

// Construye la tarjeta de cada aviso (estilo publicación de Instagram)
function crearTarjetaAviso(aviso) {
    const tarjeta = document.createElement("article");

    tarjeta.className = "tarjeta-aviso";

    if (aviso.destacado) {
        tarjeta.classList.add("destacado");
    }

    const imagen = obtenerImagenSegura(aviso.imagen_url);
    const descripcion = String(aviso.descripcion ?? "");
    const esLarga = descripcion.length > LIMITE_DESCRIPCION;

    tarjeta.innerHTML = `
        <div class="aviso-cabecera">
            <div class="aviso-avatar">
                <img src="${escaparHTML(LOGO_MARCAF)}" alt="MARCAF">
            </div>

            <div class="aviso-autor">
                <strong>MARCAF Carnes Selectas</strong>
                <span class="fecha">
                    ${escaparHTML(formatearFecha(aviso.fecha_publicacion))}
                </span>
            </div>

            ${aviso.destacado ? `
                <span class="etiqueta destacado-etiqueta aviso-fijado">
                    ★ Destacado
                </span>
            ` : ""}
        </div>

        ${imagen ? `
            <button type="button"
                    class="aviso-media aviso-media-boton"
                    aria-label="Ver publicación completa">
                <img
                    class="imagen-aviso"
                    src="${escaparHTML(imagen)}"
                    alt="${escaparHTML(aviso.titulo)}"
                    loading="lazy"
                >
            </button>
        ` : `
            <div class="aviso-media">
                <div class="aviso-sin-imagen">
                    <img src="${escaparHTML(LOGO_MARCAF)}" alt="MARCAF">
                </div>
            </div>
        `}

        <div class="contenido-aviso">
            <div class="metadatos">
                <span class="etiqueta ${escaparHTML(aviso.importancia)}">
                    ${escaparHTML(textoImportancia(aviso.importancia))}
                </span>
            </div>

            <h2>${escaparHTML(aviso.titulo)}</h2>

            <p class="descripcion-aviso${esLarga ? " colapsada" : ""}">${escaparHTML(descripcion)}</p>

            ${esLarga ? `
                <button type="button" class="boton-ver-mas">ver más</button>
            ` : ""}
        </div>
    `;

    // Botón "ver más / ver menos" para descripciones largas
    const botonVerMas = tarjeta.querySelector(".boton-ver-mas");

    if (botonVerMas) {
        const textoDescripcion = tarjeta.querySelector(".descripcion-aviso");

        botonVerMas.addEventListener("click", () => {
            const colapsada = textoDescripcion.classList.toggle("colapsada");
            botonVerMas.textContent = colapsada ? "ver más" : "ver menos";
        });
    }

    // Al pulsar la imagen se abre la publicación como en Instagram
    const botonImagen = tarjeta.querySelector(".aviso-media-boton");

    if (botonImagen) {
        botonImagen.addEventListener("click", () => abrirVisor(aviso, imagen));
    }

    return tarjeta;
}

// Muestra mensajes de estado en la página
function mostrarMensaje(texto) {
    if (mensajeAvisos) {
        mensajeAvisos.textContent = texto;
        mensajeAvisos.hidden = false;
    }
}

// Consulta los avisos publicados en Supabase
async function cargarAvisos() {
    if (!listaAvisos || !mensajeAvisos) {
        console.error(
            "No se encontraron los elementos listaAvisos o mensajeAvisos en avisos.html."
        );
        return;
    }

    listaAvisos.replaceChildren();
    mensajeAvisos.hidden = true;

    const cargando = document.createElement("p");
    cargando.className = "mensaje-cargando";
    cargando.textContent = "Cargando avisos...";
    listaAvisos.appendChild(cargando);

    try {
        const ahora = new Date().toISOString();

        const { data, error } = await clienteSupabase
            .from("avisos")
            .select(
                "id, titulo, descripcion, imagen_url, importancia, destacado, fecha_publicacion"
            )
            .eq("estado", "publicado")
            .lte("fecha_publicacion", ahora)
            .order("destacado", { ascending: false })
            .order("fecha_publicacion", { ascending: false });

        if (error) {
            throw error;
        }

        listaAvisos.replaceChildren();

        if (!data || data.length === 0) {
            mostrarMensaje("Por el momento no hay avisos publicados.");
            return;
        }

        const fragmento = document.createDocumentFragment();

        data.forEach(aviso => {
            fragmento.appendChild(crearTarjetaAviso(aviso));
        });

        listaAvisos.appendChild(fragmento);

    } catch (error) {
        console.error("Error al cargar los avisos:", error);

        listaAvisos.replaceChildren();

        mostrarMensaje(
            "No pudimos cargar los avisos. Intenta nuevamente más tarde."
        );
    }
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", cargarAvisos);