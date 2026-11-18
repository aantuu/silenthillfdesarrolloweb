const API_BASE = 'http://localhost:3000/api';

const estado = {
    armas: [],
    consumibles: [],
    objetos: []
};

const modalInstance = new bootstrap.Modal(document.getElementById('modalFicha'));

/*Carga inicial de las tres tablas desde el backend*/
async function inicializarArchivo() {
    try {
        const [resArmas, resConsumibles, resObjetos] = await Promise.all([
            fetch(`${API_BASE}/armas`),
            fetch(`${API_BASE}/consumibles`),
            fetch(`${API_BASE}/objetos`)
        ]);

        if (!resArmas.ok || !resConsumibles.ok || !resObjetos.ok) {
            throw new Error('Error al consultar una o más tablas.');
        }

        estado.armas = await resArmas.json();
        estado.consumibles = await resConsumibles.json();
        estado.objetos = await resObjetos.json();

        document.getElementById('countArmas').textContent = `(${estado.armas.length})`;
        document.getElementById('countConsumibles').textContent = `(${estado.consumibles.length})`;
        document.getElementById('countObjetos').textContent = `(${estado.objetos.length})`;

        renderizarTodo();
    } catch (error) {
        document.getElementById('alertaConexion').innerHTML = `
            <div class="alert alert-danger border-danger" role="alert">
                <strong>Error de conexión con MySQL:</strong> Verifica que el backend esté activo en <code>http://localhost:3000</code>.
            </div>`;
    }
}

/*Aplica los filtros activos de búsqueda y categoría sobre el DOM*/
function renderizarTodo() {
    const query = document.getElementById('buscadorGlobal').value.toLowerCase().trim();
    const seccion = document.getElementById('filtroSeccion').value;
    const filtroDano = document.getElementById('filtroDano').value;
    const filtroTipo = document.getElementById('filtroTipoObjeto').value;

    document.getElementById('seccionArmas').style.display = (seccion === 'TODAS' || seccion === 'armas') ? 'block' : 'none';
    document.getElementById('seccionConsumibles').style.display = (seccion === 'TODAS' || seccion === 'consumibles') ? 'block' : 'none';
    document.getElementById('seccionObjetos').style.display = (seccion === 'TODAS' || seccion === 'objetos') ? 'block' : 'none';

    const armasFiltradas = estado.armas.filter(a => {
        const coincideTexto = a.Nombre_Arma.toLowerCase().includes(query) || a.Descripcion.toLowerCase().includes(query);
        const coincideDano = filtroDano === 'TODOS' || a.Daño === filtroDano;
        return coincideTexto && coincideDano;
    });

    const consumiblesFiltrados = estado.consumibles.filter(c =>
        c.Nombre_Consumible.toLowerCase().includes(query) ||
        c.Efecto.toLowerCase().includes(query) ||
        c.Descripcion.toLowerCase().includes(query)
    );

    const objetosFiltrados = estado.objetos.filter(o => {
        const coincideTexto = o.Nombre_Objeto.toLowerCase().includes(query) || o.Descripcion.toLowerCase().includes(query);
        const coincideTipo = filtroTipo === 'TODOS' || o.Tipo === filtroTipo;
        return coincideTexto && coincideTipo;
    });

    renderizarArmas(armasFiltradas);
    renderizarConsumibles(consumiblesFiltrados);
    renderizarObjetos(objetosFiltrados);
}

/*Renderiza las tarjetas de la tabla ARMA*/
function renderizarArmas(lista) {
    const grid = document.getElementById('gridArmas');
    if (lista.length === 0) {
        grid.innerHTML = `<div class="col-12 text-secondary small">No se encontraron armas con ese criterio.</div>`;
        return;
    }

    grid.innerHTML = lista.map(arma => `
        <article class="col">
            <div class="weapon-card h-100 p-3 d-flex flex-column">
                <div class="d-flex gap-3 mb-3">
                    <!-- Miniatura con imagen dinámica -->
                    <div class="weapon-thumb overflow-hidden d-flex align-items-center justify-content-center">
                        <img src="img/arma_${arma.ID_Arma}.png" alt="${arma.Nombre_Arma}" class="w-100 h-100 object-fit-cover" onerror="this.onerror=null; this.src='img/default.png';">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start gap-2">
                            <h3 class="h6 fw-bold text-white mb-1">${arma.Nombre_Arma}</h3>
                            <span class="badge badge-dano">${arma.Daño}</span>
                        </div>
                        <div class="small text-secondary lh-sm">
                            <div>ID: ${arma.ID_Arma}</div>
                            <div>Daño: <span class="text-danger fw-semibold">${arma.Daño}</span></div>
                            <div>Durabilidad: <span class="text-light">${arma.Durabilidad}</span></div>
                        </div>
                    </div>
                </div>
                <p class="small text-secondary mb-3 flex-grow-1">${arma.Descripcion}</p>
                <button class="btn btn-sm btn-ficha w-100 py-2" onclick="abrirFicha('arma', ${arma.ID_Arma})">
                    Ver ficha
                </button>
            </div>
        </article>
    `).join('');
}

/*Renderiza las filas de la tabla CONSUMIBLE*/
function renderizarConsumibles(lista) {
    const tbody = document.getElementById('tablaConsumibles');
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-secondary small py-3">No se encontraron consumibles.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(item => `
        <tr>
            <td class="text-secondary">${item.ID_Consumible}</td>
            <td class="fw-semibold text-white">${item.Nombre_Consumible}</td>
            <td class="text-secondary small">${item.Efecto}</td>
            <td class="text-secondary small">${item.Descripcion}</td>
            <td class="text-end">
                <button class="btn-info-icon" title="Ver detalles" onclick="abrirFicha('consumible', ${item.ID_Consumible})">
                    <i class="bi bi-info-circle fs-5"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/*Renderiza las filas de la tabla OBJETO*/
function renderizarObjetos(lista) {
    const tbody = document.getElementById('tablaObjetos');
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-secondary small py-3">No se encontraron objetos o documentos.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(obj => `
        <tr>
            <td class="text-secondary">${obj.ID_Objeto}</td>
            <td class="fw-semibold text-white">${obj.Nombre_Objeto}</td>
            <td><span class="badge bg-dark border border-secondary text-light">${obj.Tipo}</span></td>
            <td class="text-secondary small">${obj.Descripcion}</td>
            <td class="text-end">
                <button class="btn-info-icon" title="Ver detalles" onclick="abrirFicha('objeto', ${obj.ID_Objeto})">
                    <i class="bi bi-info-circle fs-5"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/*Abre el modal con la información completa de un registro específico*/
function abrirFicha(tipo, id) {
    const titulo = document.getElementById('modalTitulo');
    const cuerpo = document.getElementById('modalCuerpo');

    if (tipo === 'arma') {
        const arma = estado.armas.find(a => a.ID_Arma === id);
        if (!arma) return;
        titulo.textContent = arma.Nombre_Arma;
        cuerpo.innerHTML = `
            <p class="mb-2"><span class="text-secondary">ID en Base de Datos:</span> #${arma.ID_Arma}</p>
            <p class="mb-2"><span class="text-secondary">Nivel de Daño:</span> <span class="badge badge-dano">${arma.Daño}</span></p>
            <p class="mb-3"><span class="text-secondary">Durabilidad:</span> ${arma.Durabilidad}</p>
            <hr class="border-secondary border-opacity-25">
            <p class="mb-0 text-light">${arma.Descripcion}</p>
        `;
    } else if (tipo === 'consumible') {
        const item = estado.consumibles.find(c => c.ID_Consumible === id);
        if (!item) return;
        titulo.textContent = item.Nombre_Consumible;
        cuerpo.innerHTML = `
            <p class="mb-2"><span class="text-secondary">ID en Base de Datos:</span> #${item.ID_Consumible}</p>
            <p class="mb-3"><span class="text-secondary">Efecto:</span> <span class="text-danger fw-semibold">${item.Efecto}</span></p>
            <hr class="border-secondary border-opacity-25">
            <p class="mb-0 text-light">${item.Descripcion}</p>
        `;
    } else if (tipo === 'objeto') {
        const obj = estado.objetos.find(o => o.ID_Objeto === id);
        if (!obj) return;
        titulo.textContent = obj.Nombre_Objeto;
        cuerpo.innerHTML = `
            <p class="mb-2"><span class="text-secondary">ID en Base de Datos:</span> #${obj.ID_Objeto}</p>
            <p class="mb-3"><span class="text-secondary">Clasificación:</span> ${obj.Tipo}</p>
            <hr class="border-secondary border-opacity-25">
            <p class="mb-0 text-light">${obj.Descripcion}</p>
        `;
    }

    modalInstance.show();
}

/*Restablece los filtros de búsqueda y lleva la vista al inicio de la página*/
function reiniciarVista(event) {
    event.preventDefault();
    
    // Limpiar campos de búsqueda y filtros
    document.getElementById('buscadorGlobal').value = '';
    document.getElementById('filtroSeccion').value = 'TODAS';
    document.getElementById('filtroDano').value = 'TODOS';
    document.getElementById('filtroTipoObjeto').value = 'TODOS';
    
    // Volver a renderizar todo sin filtros
    renderizarTodo();
    
    // Ir arriba suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('buscadorGlobal').addEventListener('input', renderizarTodo);
document.getElementById('filtroSeccion').addEventListener('change', renderizarTodo);
document.getElementById('filtroDano').addEventListener('change', renderizarTodo);
document.getElementById('filtroTipoObjeto').addEventListener('change', renderizarTodo);

document.addEventListener('DOMContentLoaded', inicializarArchivo);