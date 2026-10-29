
let productos = [];
const SUPABASE_URL = "https://rjlletybgreacibxhxug.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbGxldHliZ3JlYWNpYnhoeHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyODA2ODIsImV4cCI6MjEwODg1NjY4Mn0.wFp3s0xtTWUwYy1Ybi96u50935Rfl9gWOleJHn5Fbjg";

const clienteSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const grid = document.getElementById("productosGrid");
const ventanaProducto = document.getElementById("ventanaProducto");
const ventanaReceta = document.getElementById("ventanaReceta");
const detalleProducto = document.getElementById("detalleProducto");
const detalleReceta = document.getElementById("detalleReceta");

const campoBusqueda = document.getElementById("buscarProducto");
const botonBuscar = document.getElementById("botonBuscar");

let categoriaActiva = "todos";

// Evita que textos guardados en la base de datos se interpreten como HTML.
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// Convierte una ruta guardada en Supabase a una ruta utilizable.
// Para las imágenes locales guarda, por ejemplo:
// images/productos/bistec.jpg
function obtenerRutaImagen(ruta) {
    const valor = String(ruta || "").trim();

    if (!valor) return "";

    // Permite URLs HTTPS y rutas relativas locales.
    if (/^https:\/\//i.test(valor)) return valor;

    if (/^(javascript|data):/i.test(valor) || valor.startsWith("//")) {
        return "";
    }

    // productos.html está dentro de pages/.
    // La ruta de imágenes debe comenzar desde la raíz del sitio.
    return "../" + valor.replace(/^\.?\//, "");
}

// ==========================================
// CARGAR PRODUCTOS Y RECETAS DE SUPABASE
// ==========================================
async function cargarProductos() {
    grid.innerHTML = `
        <p class="mensaje-sin-productos">
            Cargando productos...
        </p>
    `;

    try {
        const { data, error } = await clienteSupabase
            .from("productos")
            .select(`
                id,
                nombre,
                categoria,
                descripcion,
                imagen,
                recetas (
                    id,
                    nombre,
                    tiempo,
                    ingredientes,
                    pasos
                )
            `)
            .eq("activo", true)
            .order("nombre", { ascending: true });

        if (error) throw error;

        productos = (data || []).map(producto => ({
            ...producto,
            categoria: String(producto.categoria || "")
                .trim()
                .toLowerCase(),
            recetas: Array.isArray(producto.recetas)
                ? producto.recetas
                : []
        }));

        renderizarProductos();
    } catch (error) {
        console.error("Error al cargar productos:", error);

        grid.innerHTML = `
            <p class="mensaje-sin-productos">
                No se pudieron cargar los productos.
                Verifica la conexión con Supabase, las tablas y sus permisos.
            </p>
        `;
    }
}

// ==========================================
// MOSTRAR Y FILTRAR PRODUCTOS
// ==========================================
function renderizarProductos(
    categoria = categoriaActiva,
    busqueda = campoBusqueda?.value || ""
) {
    categoriaActiva = categoria;

    const texto = busqueda.trim().toLocaleLowerCase("es");

    const lista = productos.filter(producto => {
        const coincideCategoria =
            categoria === "todos" ||
            producto.categoria === categoria;

        const textoProducto = [
            producto.nombre,
            producto.categoria,
            producto.descripcion
        ].join(" ").toLocaleLowerCase("es");

        return coincideCategoria && textoProducto.includes(texto);
    });

    if (lista.length === 0) {
        grid.innerHTML = `
            <p class="mensaje-sin-productos">
                No se encontraron productos.
                Intenta con otra búsqueda.
            </p>
        `;
        return;
    }

    grid.innerHTML = lista.map(producto => {
        const imagen = obtenerRutaImagen(producto.imagen);

        return `
            <button class="tarjeta-producto"
                    data-producto="${producto.id}"
                    aria-label="Ver ${escaparHTML(producto.nombre)}">

                ${imagen ? `
                    <img src="${escaparHTML(imagen)}"
                         alt="${escaparHTML(producto.nombre)}"
                         loading="lazy">
                ` : ""}

                <h2>${escaparHTML(producto.nombre)}</h2>
                <p>Conoce este producto</p>
                <span class="ver-detalle">Ver detalles</span>
            </button>
        `;
    }).join("");
}

// Buscar con el botón o pulsando Enter.
function buscarProductos() {
    renderizarProductos(categoriaActiva);
}

if (botonBuscar && campoBusqueda) {
    botonBuscar.addEventListener("click", buscarProductos);

    campoBusqueda.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            buscarProductos();
        }
    });
}

// ==========================================
// ABRIR DETALLE DE PRODUCTO
// ==========================================
function abrirProducto(id) {
    const producto = productos.find(p => String(p.id) === String(id));
    if (!producto) return;

    const imagen = obtenerRutaImagen(producto.imagen);

    const recetasHTML = producto.recetas.length
        ? producto.recetas.map(receta => `
            <button class="tarjeta-receta"
                    data-receta="${receta.id}"
                    data-producto="${producto.id}">

                <strong>${escaparHTML(receta.nombre)}</strong>
                <span>⏱ ${escaparHTML(receta.tiempo || "Tiempo variable")}</span>
                <span class="ver-detalle">Ver receta →</span>
            </button>
        `).join("")
        : `<p>Próximamente agregaremos recetas para este producto.</p>`;

    detalleProducto.innerHTML = `
        <section class="detalle-encabezado">
            ${imagen ? `
                <img src="${escaparHTML(imagen)}"
                     alt="${escaparHTML(producto.nombre)}">
            ` : ""}

            <div>
                <span class="etiqueta">Producto MARCAF</span>
                <h2>${escaparHTML(producto.nombre)}</h2>
                <p>${escaparHTML(producto.descripcion)}</p>
            </div>
        </section>

        <section class="seccion-recetas">
            <h3>Recetas que puedes preparar</h3>
            <p>Selecciona una receta para consultar sus ingredientes y preparación.</p>

            <div class="recetas-grid">
                ${recetasHTML}
            </div>
        </section>
    `;

    ventanaProducto.showModal();
}

// ==========================================
// ABRIR RECETA DESDE SUPABASE
// ==========================================
function abrirReceta(productoId, recetaId) {
    const producto = productos.find(
        p => String(p.id) === String(productoId)
    );

    const receta = producto?.recetas.find(
        r => String(r.id) === String(recetaId)
    );

    if (!producto || !receta) return;

    const ingredientes = Array.isArray(receta.ingredientes)
        ? receta.ingredientes
        : [];

    const pasos = Array.isArray(receta.pasos)
        ? receta.pasos
        : [];

    detalleReceta.innerHTML = `
        <div class="contenido-receta">
            <span class="etiqueta">
                Receta con ${escaparHTML(producto.nombre)}
            </span>

            <h2>${escaparHTML(receta.nombre)}</h2>
            <p>⏱ Tiempo aproximado: ${escaparHTML(receta.tiempo || "No especificado")}</p>

            <h3>Ingredientes</h3>
            ${ingredientes.length ? `
                <ul>
                    ${ingredientes.map(item =>
                        `<li>${escaparHTML(item)}</li>`
                    ).join("")}
                </ul>
            ` : "<p>Ingredientes pendientes de agregar.</p>"}

            <h3>Preparación</h3>
            ${pasos.length ? `
                <ol>
                    ${pasos.map(paso =>
                        `<li>${escaparHTML(paso)}</li>`
                    ).join("")}
                </ol>
            ` : "<p>Preparación pendiente de agregar.</p>"}
        </div>
    `;

    ventanaProducto.close();
    ventanaReceta.showModal();
}

// Clic en una tarjeta del catálogo.
grid.addEventListener("click", event => {
    const tarjeta = event.target.closest("[data-producto]");
    if (!tarjeta) return;

    abrirProducto(tarjeta.dataset.producto);
});

// Clic en una receta.
detalleProducto.addEventListener("click", event => {
    const tarjeta = event.target.closest("[data-receta]");
    if (!tarjeta) return;

    abrirReceta(
        tarjeta.dataset.producto,
        tarjeta.dataset.receta
    );
});

// Filtros de categorías.
document.querySelectorAll(".filtro").forEach(boton => {
    boton.addEventListener("click", () => {
        document.querySelector(".filtro.activo")
            ?.classList.remove("activo");

        boton.classList.add("activo");
        categoriaActiva = boton.dataset.categoria;

        renderizarProductos(categoriaActiva);
    });
});

// Cerrar ventanas.
document.getElementById("cerrarProducto")
    .addEventListener("click", () => ventanaProducto.close());

document.getElementById("cerrarReceta")
    .addEventListener("click", () => ventanaReceta.close());

[ventanaProducto, ventanaReceta].forEach(ventana => {
    ventana.addEventListener("click", event => {
        if (event.target === ventana) ventana.close();
    });
});

// Iniciar el catálogo consultando la base de datos.
cargarProductos();
