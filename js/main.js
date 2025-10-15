import * as api from './api.js';
import * as ui from './ui.js';

let todosLosProductos = [];
let carrito = [];
let filtroActual = 'todos';

let usuarioActual = JSON.parse(localStorage.getItem('usuarioActual')) || null;

async function manejarRegistro(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre-registro').value;
    const email = document.getElementById('email-registro').value;
    const password = document.getElementById('password-registro').value;

    try {
        const resultado = await api.registerUser({ nombre, email, password });
        ui.mostrarMensaje(resultado.message, 'exito');
        ui.alternarFormulario('login');
    } catch (error) {
        ui.mostrarMensaje(error.message, 'error');
    }
}

async function manejarLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email-login').value;
    const password = document.getElementById('password-login').value;

    try {
        const usuario = await api.loginUser({ email, password });
        usuarioActual = usuario;
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));
        
        ui.mostrarMensaje(`Bienvenido, ${usuario.nombre}`, 'exito');
        ui.cerrarModalLogin();
        ui.actualizarEstadoSesion(usuarioActual);
    } catch (error) {
        ui.mostrarMensaje(error.message, 'error');
    }
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        usuarioActual = null;
        localStorage.removeItem('usuarioActual');
        ui.actualizarEstadoSesion(null);
    }
}

// --- Lógica del Carrito ---

function agregarAlCarrito(id) {
    const producto = todosLosProductos.find(p => p.id === id);
    if (!producto || producto.cantidad === 0) return;

    const itemEnCarrito = carrito.find(item => item.id === id);

    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    ui.renderizarCarrito(carrito, manejadoresCarrito);
    ui.actualizarContadorCarrito(carrito);
    ui.mostrarMensaje(`${producto.nombre} agregado al carrito`, 'exito');
}

const manejadoresCarrito = {
    onAumentar: (id) => {
        const item = carrito.find(i => i.id === id);
        if (item) item.cantidad++;
        ui.renderizarCarrito(carrito, manejadoresCarrito);
        ui.actualizarContadorCarrito(carrito);

    },
    onDisminuir: (id) => {
        const item = carrito.find(i => i.id === id);
        if (item && item.cantidad > 1) {
            item.cantidad--;
        } else {
            carrito = carrito.filter(i => i.id !== id);
        }
        ui.renderizarCarrito(carrito, manejadoresCarrito);
        ui.actualizarContadorCarrito(carrito);

    },
    onEliminar: (id) => {
        carrito = carrito.filter(i => i.id !== id);
        ui.renderizarCarrito(carrito, manejadoresCarrito);
        ui.actualizarContadorCarrito(carrito);
    }
};

async function finalizarCompra() {
    if (!usuarioActual) {
        ui.mostrarMensaje('Debes iniciar sesión para realizar una compra.', 'error');
        ui.cerrarCarrito();
        ui.abrirModalLogin();
        return;
    }

    if (carrito.length === 0) {
        ui.mostrarMensaje('Tu carrito está vacío.', 'error');
        return;
    }

    // Prepara el objeto de venta como lo espera el nuevo backend
    const ventaData = {
        clienteId: usuarioActual.id,
        productos: carrito.map(item => ({
            productoId: item.id,
            cantidad: item.cantidad,
        })),
        total: carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    };

    try {
        const resultado = await api.registrarVenta(ventaData);
        ui.mostrarMensaje(resultado.message, 'exito');
        
        carrito = [];
        ui.renderizarCarrito(carrito, manejadoresCarrito);
        ui.actualizarContadorCarrito(carrito);
        ui.cerrarCarrito();
        cargarProductos(); // Recargar productos para actualizar el stock en la UI
    } catch (error) {
        ui.mostrarMensaje(`Error en la compra: ${error.message}`, 'error');
    }
}


// --- Lógica de Productos ---

async function cargarProductos() {
    try {
        todosLosProductos = await api.getProductos();
        filtrarYRenderizar();
    } catch (error) {
        ui.mostrarMensaje('No se pudieron cargar los productos.', 'error');
    }
}

function filtrarYRenderizar() {
    let productosFiltrados = todosLosProductos;
    if (filtroActual !== 'todos') {
        productosFiltrados = todosLosProductos.filter(p => p.tipo === filtroActual);
    }
    ui.renderizarProductos(productosFiltrados, agregarAlCarrito);
}

// --- Inicialización y Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();

    // --- Modal de Autenticación ---
    const cuentaBtn = document.querySelector('a[href="#"] .ph-user-circle')?.closest('a');
    const cerrarModalBtn = document.getElementById('cerrar-modal');
    const overlayModal = document.getElementById('overlay-modal');

    if (cuentaBtn) {
        cuentaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ui.abrirModalLogin();
        });
    }
    if (cerrarModalBtn) cerrarModalBtn.addEventListener('click', ui.cerrarModalLogin);
    if (overlayModal) overlayModal.addEventListener('click', ui.cerrarModalLogin);

    const inputBusqueda = document.getElementById('input-busqueda');
    inputBusqueda.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        const productosFiltrados = todosLosProductos.filter(producto =>
            producto.nombre.toLowerCase().includes(termino)
        );
        ui.renderizarProductos(productosFiltrados, agregarAlCarrito);
    });

    // Filtros
    document.getElementById('todos-link').addEventListener('click', () => {
        filtroActual = 'todos';
        mostrarCatalogo();
        filtrarYRenderizar();
    });
    document.getElementById('juegos-link').addEventListener('click', () => {
        filtroActual = 'juego';
        mostrarCatalogo();
        filtrarYRenderizar();
    });
    document.getElementById('consolas-link').addEventListener('click', () => {
        filtroActual = 'consola';
        mostrarCatalogo();
        filtrarYRenderizar();
    });

    // Carrito
    document.getElementById('cerrar-carrito').addEventListener('click', ui.cerrarCarrito);
    // Asumimos que hay un botón para abrir el carrito con el id 'abrir-carrito-btn' en el header
    document.getElementById('abrir-carrito-btn').addEventListener('click', ui.abrirCarrito);
    document.getElementById('finalizar-compra-btn').addEventListener('click', finalizarCompra);
    

    document.getElementById('form-login').addEventListener('submit', manejarLogin);
    document.getElementById('form-registro').addEventListener('submit', manejarRegistro);
    document.getElementById('login-tab').addEventListener('click', () => ui.alternarFormulario('login'));
    document.getElementById('register-tab').addEventListener('click', () => ui.alternarFormulario('register'));
    document.addEventListener('cerrarSesion', cerrarSesion);
    document.getElementById('mis-pedidos-link').addEventListener('click', mostrarMisPedidos);

    ui.actualizarEstadoSesion(usuarioActual);

});

async function mostrarMisPedidos() {
    if (!usuarioActual) {
        ui.mostrarMensaje('Debes iniciar sesión para ver tus pedidos.', 'error');
        return;
    }

    // Oculta la vista de productos y muestra la de pedidos
    document.getElementById('productos').classList.add('hidden');
    document.getElementById('mis-pedidos').classList.remove('hidden');

    try {
        const pedidos = await api.getPedidosPorCliente(usuarioActual.id);
        ui.renderizarPedidos(pedidos);
    } catch (error) {
        ui.mostrarMensaje('Error al cargar tus pedidos.', 'error');
    }
}

function mostrarCatalogo() {
    document.getElementById('productos').classList.remove('hidden');
    document.getElementById('mis-pedidos').classList.add('hidden');
}