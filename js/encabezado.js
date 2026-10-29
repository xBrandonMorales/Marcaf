/* ==========================================
   ENCABEZADO MARCAF
   Arriba de la página se ve completo; al hacer
   scroll hacia abajo se esconde la barra y el
   logo, y solo quedan los botones.
========================================== */

(function () {
    const encabezado = document.querySelector(".encabezado");

    if (!encabezado) return;

    // Píxeles de scroll a partir de los cuales se esconde la barra
    const LIMITE = 20;

    function actualizarEncabezado() {
        encabezado.classList.toggle("compacto", window.scrollY > LIMITE);
    }

    window.addEventListener("scroll", actualizarEncabezado, { passive: true });

    // Por si la página se abre ya desplazada (recarga a media página)
    actualizarEncabezado();
})();