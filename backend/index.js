const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// 1. Configuración de Mercado Pago
// Asegúrate de tener MP_ACCESS_TOKEN en tu archivo .env
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

// 2. Ruta para crear la preferencia de pago (Checkout)
app.post('/api/checkout', async (req, res) => {
    try {
        const preference = new Preference(client);
        const { items, email } = req.body;

        // Estructura de la preferencia requerida por Mercado Pago
        const body = {
            items: items.map(item => ({
                id: item.id,
                title: item.nombre,
                unit_price: Number(item.precio),
                quantity: Number(item.cantidad || 1),
                currency_id: 'ARS', // Cambia según tu país (MXN, CLP, etc.)
                picture_url: item.imagen_url // Opcional: muestra la foto en el checkout
            })),
            back_urls: {
                success: 'http://localhost:3000/success',
                failure: 'http://localhost:3000/failure',
                pending: 'http://localhost:3000/pending',
            },
            auto_return: 'approved',
            metadata: { 
                client_email: email 
            },
            // Notificación para actualizar tu base de datos en el futuro
            notification_url: "https://tu-dominio.com/api/webhook", 
        };

        const response = await preference.create({ body });

        // Enviamos el ID y el init_point (el link de pago) al frontend
        res.json({ 
            id: response.id, 
            init_point: response.init_point 
        });

    } catch (error) {
        console.error("Error en Mercado Pago:", error);
        res.status(500).json({ 
            error: 'No se pudo crear la preferencia de pago',
            details: error.message 
        });
    }
});

// 3. Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.send('Servidor de Moriancumer 3D funcionando 🚀');
});

// Inicio del servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});