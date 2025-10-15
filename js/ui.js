// --- Elementos del DOM ---
const listaProductos = document.getElementById('lista-productos');
const itemsCarrito = document.getElementById('items-carrito');
const totalCarrito = document.getElementById('total-carrito');
const carritoPanel = document.getElementById('carrito-panel');

function formatCurrencyCOP(numero) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numero);
}

// --- Funciones de Renderizado ---

export function renderizarProductos(productos, onAddToCart) {
    if (!listaProductos) return;
    listaProductos.innerHTML = ''; 

    if (productos.length === 0) {
        listaProductos.innerHTML = `<p class="text-gray-500 col-span-full text-center">No se encontraron productos.</p>`;
        return;
    }

    productos.forEach(producto => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'bg-white rounded-lg shadow-md flex flex-col hover:shadow-xl transition-shadow duration-300 overflow-hidden';
        
        const imageUrl = producto.imagenUrl || `https://placehold.co/400x300?text=${encodeURIComponent(producto.nombre)}`;

        tarjeta.innerHTML = `
            <div class="w-full h-48 bg-gray-200 flex items-center justify-center">
                <img src="${imageUrl}" alt="${producto.nombre}" class="w-full h-full object-cover">
            </div>
            <div class="p-4 flex flex-col flex-grow">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 flex-grow">${producto.nombre}</h3>
                <p class="text-sm text-gray-500 mb-2 capitalize">${producto.tipo}</p>
                <div class="mt-auto">
                    <p class="text-2xl font-bold text-gray-900 mb-4">${formatCurrencyCOP(producto.precio)}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium ${producto.cantidad > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${producto.cantidad > 0 ? `Stock: ${producto.cantidad}` : 'Agotado'}
                        </span>
                        <button 
                            data-id="${producto.id}" 
                            class="btn-agregar-carrito bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-semibold disabled:bg-gray-400"
                            ${producto.cantidad === 0 ? 'disabled' : ''}>
                            <i class="ph ph-shopping-cart-simple"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        listaProductos.appendChild(tarjeta);
    });

    document.querySelectorAll('.btn-agregar-carrito').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            onAddToCart(id);
        });
    });
}

export function renderizarCarrito(carrito, handlers) {
    if (!itemsCarrito || !totalCarrito) return;
    itemsCarrito.innerHTML = '';

    if (carrito.length === 0) {
        itemsCarrito.innerHTML = '<p class="text-gray-500">Tu carrito está vacío.</p>';
        totalCarrito.textContent = 'USD 0.00';
        return;
    }

    let total = 0;
    carrito.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex items-center gap-4';
        itemDiv.innerHTML = `
            <div class="flex-1">
                <h4 class="text-sm font-medium">${item.nombre}</h4>
                <p class="text-xs text-gray-600">
                    <button data-id="${item.id}" class="btn-disminuir text-red-600 hover:text-red-800 font-bold px-2">-</button>
                    ${item.cantidad}
                    <button data-id="${item.id}" class="btn-aumentar text-green-600 hover:text-green-800 font-bold px-2">+</button>
                    | ${formatCurrencyCOP(item.precio * item.cantidad)}
                </p>
            </div>
            <button data-id="${item.id}" class="btn-eliminar text-red-600 hover:text-red-800 font-bold">&times;</button>
        `;
        itemsCarrito.appendChild(itemDiv);
        total += item.precio * item.cantidad;
    });

    totalCarrito.textContent = formatCurrencyCOP(total);

    // Asignar eventos a los botones del carrito
    document.querySelectorAll('.btn-aumentar').forEach(b => b.addEventListener('click', () => handlers.onAumentar(parseInt(b.dataset.id))));
    document.querySelectorAll('.btn-disminuir').forEach(b => b.addEventListener('click', () => handlers.onDisminuir(parseInt(b.dataset.id))));
    document.querySelectorAll('.btn-eliminar').forEach(b => b.addEventListener('click', () => handlers.onEliminar(parseInt(b.dataset.id))));
}

// --- Funciones de UI generales ---

export function mostrarMensaje(texto, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo === 'exito' ? 'success' : tipo}`;

    // Asignar un ícono según el tipo de mensaje
    const iconClass = {
        exito: 'ph-check-circle',
        error: 'ph-x-circle',
        info: 'ph-info'
    };

    toast.innerHTML = `
        <i class="ph ${iconClass[tipo]} text-2xl mr-3"></i>
        <span>${texto}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 3000);
}

export function abrirCarrito() {
    if (carritoPanel) carritoPanel.classList.remove('translate-x-full');
}

export function cerrarCarrito() {
    if (carritoPanel) carritoPanel.classList.add('translate-x-full');
}

// --- Funciones para la página de Administración ---

const tablaProductos = document.getElementById('tabla-productos');
const productoModal = document.getElementById('producto-modal');
const modalTitulo = document.getElementById('modal-titulo');
const productoForm = document.getElementById('producto-form');

export function renderizarTablaProductos(productos, handlers) {
    if (!tablaProductos) return;
    tablaProductos.innerHTML = '';

    productos.forEach(p => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="py-2 px-4 border-b">${p.id}</td>
            <td class="py-2 px-4 border-b">${p.nombre}</td>
            <td class="py-2 px-4 border-b">${p.tipo}</td>
            <td class="py-2 px-4 border-b">${formatCurrencyCOP(p.precio)}</td>
            <td class="py-2 px-4 border-b">${p.cantidad}</td>
            <td class="py-2 px-4 border-b">
                <button data-id="${p.id}" class="btn-editar bg-yellow-500 text-white px-2 py-1 rounded text-sm">Editar</button>
                <button data-id="${p.id}" class="btn-eliminar-admin bg-red-600 text-white px-2 py-1 rounded text-sm">Eliminar</button>
            </td>
        `;
        tablaProductos.appendChild(fila);
    });

    document.querySelectorAll('.btn-editar').forEach(b => b.addEventListener('click', () => handlers.onEditar(parseInt(b.dataset.id))));
    document.querySelectorAll('.btn-eliminar-admin').forEach(b => b.addEventListener('click', () => handlers.onEliminar(parseInt(b.dataset.id))));
}

export function abrirModalProducto(producto = null) {
    if (!productoModal) return;
    productoForm.reset();
    if (producto) {
        modalTitulo.textContent = 'Editar Producto';
        document.getElementById('producto-id-input').value = producto.id;
        document.getElementById('id').value = producto.id;
        document.getElementById('id').setAttribute('disabled', true);
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('tipo').value = producto.tipo;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('cantidad').value = producto.cantidad;
        document.getElementById('imagenUrl').value = producto.imagenUrl || '';
    } else {
        modalTitulo.textContent = 'Agregar Producto';
        document.getElementById('id').removeAttribute('disabled');
    }
    productoModal.classList.remove('hidden');
    productoModal.classList.add('flex');
}

export function cerrarModalProducto() {
    if (productoModal) productoModal.classList.add('hidden');
}

export function actualizarContadorCarrito(carrito) {
    const contador = document.getElementById('carrito-contador');
    if (!contador) return;

    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    contador.textContent = totalItems;
}

// --- Funciones para el Modal de Login ---
const modalLogin = document.getElementById('modal-login');

export function alternarFormulario(tipo) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');

    if (tipo === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('border-red-600', 'text-red-600');
        registerTab.classList.remove('border-red-600', 'text-red-600');
    } else {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        registerTab.classList.add('border-red-600', 'text-red-600');
        loginTab.classList.remove('border-red-600', 'text-red-600');
    }
}

export function actualizarEstadoSesion(usuario) {
    const misPedidosLink = document.getElementById('mis-pedidos-link');
    const cuentaBtn = document.querySelector('a[href="#"] .ph-user-circle')?.closest('a');
    const adminLink = document.getElementById('admin-link');
    if (!cuentaBtn) return;

    const nuevoBtn = cuentaBtn.cloneNode(true);
    cuentaBtn.parentNode.replaceChild(nuevoBtn, cuentaBtn);

    if (usuario) {
        nuevoBtn.querySelector('span').textContent = 'Cerrar Sesión';
        nuevoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('cerrarSesion'));
        });
        
        // --- Lógica de Roles ---
        if (usuario.rol === 'admin' && adminLink) {
            adminLink.classList.remove('hidden');
        } else if (adminLink) {
            adminLink.classList.add('hidden');
        }
        if (misPedidosLink) misPedidosLink.classList.remove('hidden');
    } else {
        nuevoBtn.querySelector('span').textContent = 'Cuenta';
        nuevoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalLogin();
        });
        
        if (adminLink) {
            adminLink.classList.add('hidden');
        }
        if (misPedidosLink) misPedidosLink.classList.add('hidden');
    }
}

export function abrirModalLogin() {
    if (modalLogin) {
        modalLogin.classList.remove('hidden');
        modalLogin.classList.add('flex');
    }
}

export function cerrarModalLogin() {
    if (modalLogin) {
        modalLogin.classList.add('hidden');
        modalLogin.classList.remove('flex');
    }
}

export function renderizarPedidos(pedidos) {
    const contenedor = document.getElementById('lista-pedidos');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (pedidos.length === 0) {
        contenedor.innerHTML = `<p class="text-gray-500 text-center">No has realizado ningún pedido todavía.</p>`;
        return;
    }

    pedidos.forEach(pedido => {
        const pedidoDiv = document.createElement('div');
        pedidoDiv.className = 'bg-white rounded-lg shadow-md overflow-hidden';

        const productosHTML = pedido.productos.map(item => {
            const imageUrl = item.producto.imagenUrl || `https://placehold.co/100x100?text=${encodeURIComponent(item.producto.nombre)}`;
            return `
                <div class="flex items-center gap-4 p-3 border-b last:border-b-0">
                    <img src="${imageUrl}" alt="${item.producto.nombre}" class="w-16 h-16 object-cover rounded">
                    <div class="flex-grow">
                        <p class="font-semibold">${item.producto.nombre}</p>
                        <p class="text-sm text-gray-600">Cantidad: ${item.cantidad} | Precio U: ${formatCurrencyCOP(item.producto.precio)}</p>
                    </div>
                    <p class="font-semibold">${formatCurrencyCOP(item.producto.precio * item.cantidad)}</p>
                </div>
            `;
        }).join('');

        pedidoDiv.innerHTML = `
            <div class="p-4 bg-gray-50 cursor-pointer flex justify-between items-center" onclick="document.getElementById('pedido-detalle-${pedido._id}').classList.toggle('hidden')">
                <div>
                    <p class="font-bold">Pedido #${pedido._id.slice(-6)}</p>
                    <p class="text-sm text-gray-600">Fecha: ${new Date(pedido.fecha).toLocaleDateString('es-CO')}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-lg">${formatCurrencyCOP(pedido.total)}</p>
                    <i class="ph ph-caret-down"></i>
                </div>
            </div>
            <div id="pedido-detalle-${pedido._id}" class="hidden">
                ${productosHTML}
            </div>
        `;
        contenedor.appendChild(pedidoDiv);
    });
}