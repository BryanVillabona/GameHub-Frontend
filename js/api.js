const BASE_URL = 'http://localhost:4000/api/v1';

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            if (data.errors && Array.isArray(data.errors)) {
                const errorMessages = data.errors.map(err => err.msg).join(' ');
                throw new Error(errorMessages);
            }
            throw new Error(data.error || 'Algo salió mal');
        }
        return data;
    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error);
        throw error;
    }
}

// --- Productos
export const getProductos = () => fetchAPI('/productos');
export const createProducto = (producto) => fetchAPI('/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
});
export const updateProducto = (id, producto) => fetchAPI(`/productos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
});
export const deleteProducto = (id) => fetchAPI(`/productos/${id}`, {
    method: 'DELETE',
});

// --- Autenticación
export const registerUser = (userData) => fetchAPI('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
});

export const loginUser = (credentials) => fetchAPI('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
});


// --- Ventas 
export const registrarVenta = (ventaData) => fetchAPI('/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ventaData),
});

// --- Pedidos ---
export const getPedidosPorCliente = (clienteId) => fetchAPI(`/ventas/cliente/${clienteId}`);