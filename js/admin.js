import * as api from './api.js';
import * as ui from './ui.js';

let productosAdmin = [];
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));

    if (!usuarioActual || usuarioActual.rol !== 'admin') {
        window.location.href = 'index.html';
        sessionStorage.setItem('errorMsg', 'Acceso denegado. No tienes permisos de administrador.');
    } else {
        cargarProductosAdmin();
    }
});

// --- Lógica de Productos (Admin) ---

async function cargarProductosAdmin() {
    try {
        productosAdmin = await api.getProductos();
        ui.renderizarTablaProductos(productosAdmin, manejadoresAdmin);
    } catch (error) {
        ui.mostrarMensaje('No se pudieron cargar los productos.', 'error');
    }
}

async function guardarProducto(e) {
    e.preventDefault();
    const producto = {
        id: parseInt(document.getElementById('id').value),
        nombre: document.getElementById('nombre').value,
        tipo: document.getElementById('tipo').value,
        precio: parseFloat(document.getElementById('precio').value),
        cantidad: parseInt(document.getElementById('cantidad').value),
        imagenUrl: document.getElementById('imagenUrl').value
    };

    try {
        if (editandoId) {
            await api.updateProducto(editandoId, producto);
            ui.mostrarMensaje('Producto actualizado con éxito', 'exito');
        } else {
            await api.createProducto(producto);
            ui.mostrarMensaje('Producto creado con éxito', 'exito');
        }
        ui.cerrarModalProducto();
        cargarProductosAdmin();
    } catch (error) {
        const mensaje = error.message || 'Error al guardar el producto.';
        ui.mostrarMensaje(mensaje, 'error');
    }
}

async function eliminarProductoAdmin(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            await api.deleteProducto(id);
            ui.mostrarMensaje('Producto eliminado con éxito', 'exito');
            cargarProductosAdmin();
        } catch (error) {
            ui.mostrarMensaje('Error al eliminar el producto.', 'error');
        }
    }
}

const manejadoresAdmin = {
    onEditar: (id) => {
        const producto = productosAdmin.find(p => p.id === id);
        if (producto) {
            editandoId = id;
            ui.abrirModalProducto(producto);
        }
    },
    onEliminar: (id) => {
        eliminarProductoAdmin(id);
    }
};

// --- Inicialización y Event Listeners (Admin) ---

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('abrir-modal-crear-btn').addEventListener('click', () => {
        editandoId = null;
        ui.abrirModalProducto();
    });

    document.getElementById('cerrar-modal-btn').addEventListener('click', ui.cerrarModalProducto);
    document.getElementById('producto-form').addEventListener('submit', guardarProducto);
});