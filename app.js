// app.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware para parsear JSON y manejar rawBody para webhooks
app.use(express.json());
app.use((req, res, next) => {
  let data = [];
  req.on('data', chunk => {
    data.push(chunk);
  });
  req.on('end', () => {
    req.rawBody = Buffer.concat(data);
    next();
  });
});

// Variables de entorno
const API_URL = process.env.WHATSAPP_API_BASE_URL;
const API_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const TARGET_PHONE = process.env.TARGET_PHONE_NUMBER;

// Función para enviar un mensaje de texto
async function sendTextMessage(to, message) {
    const url = `${API_URL}/messages`;
    const data = {
        messaging_product: "whatsapp",
        to: `+${to}`,
        type: "text",
        text: {
            body: message
        },
        // Opcional: Incluir el phone_number_id
        // phone_number_id: PHONE_ID
    };

    try {
        console.log(`Intentando enviar mensaje a: ${to}`);
        const response = await axios.post(url, data, {
            headers: {
                'D360-API-KEY': API_TOKEN,
                'Content-Type': 'application/json'
            },
            timeout: 35000 // 35 segundos de timeout
        });
        console.log(`Mensaje enviado exitosamente a ${to}. ID de mensaje: ${response.data.messages[0]?.id || 'N/A'}`);
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error(`Timeout al enviar mensaje a ${to}.`);
        } else {
            console.error(`Error al enviar mensaje a ${to}:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                response_data: error.response?.data
            });
        }
        return null;
    }
}

// Endpoint para validar el webhook
app.get('/webhook', (req, res) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    console.log('Solicitud de validación recibida:', { mode, token });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Token de verificación correcto. Webhook validado.');
        return res.status(200).send(challenge);
    }

    console.error('Error de verificación del webhook:', { receivedToken: token, expectedToken: VERIFY_TOKEN });
    return res.status(403).send('Token de verificación inválido.');
});

// Endpoint para manejar el webhook (POST)
app.post('/webhook', async (req, res) => {
    const body = req.body;
    console.log('Webhook recibido:', JSON.stringify(body, null, 2));

    // Verificar la estructura del webhook
    const entries = body?.entry;
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        console.log('No se encontraron entradas en el webhook.');
        return res.status(200).send('OK');
    }

    for (const entry of entries) {
        const changes = entry?.changes;
        if (!changes || !Array.isArray(changes) || changes.length === 0) {
            console.log('No se encontraron cambios en la entrada.');
            continue;
        }

        for (const change of changes) {
            const value = change?.value;
            if (!value) {
                console.log('No se encontró valor en el cambio.');
                continue;
            }

            // Procesar mensajes
            const messages = value?.messages;
            if (messages && Array.isArray(messages) && messages.length > 0) {
                console.log(`Procesando ${messages.length} mensaje(s).`);
                for (const message of messages) {
                    const from = message?.from;
                    const text = message?.text?.body?.toLowerCase().trim(); // Convertir a minúsculas para comparación

                    console.log(`Mensaje recibido de: ${from}, Texto: "${text}"`);

                    // Verificar si es del número objetivo y el texto es "hello"
                    if (from === TARGET_PHONE && text === 'hello') {
                        console.log(`Mensaje "hello" recibido del número objetivo ${TARGET_PHONE}. Enviando respuesta...`);
                        try {
                            await sendTextMessage(from, "Hi There!");
                            console.log(`Respuesta enviada a ${from}.`);
                        } catch (error) {
                            console.error(`Error al enviar respuesta a ${from}:`, error.message);
                        }
                        // Romper el bucle interno si ya procesamos el mensaje objetivo
                        break;
                    } else if (from === TARGET_PHONE) {
                        console.log(`Mensaje de ${TARGET_PHONE} no es "hello", ignorando.`);
                    } else {
                        console.log(`Mensaje de ${from} no es del número objetivo, ignorando.`);
                    }
                }
            }
        }
    }

    // Responder con 200 OK para confirmar recepción
    res.status(200).send('OK');
});

// Endpoint para testear envío manual (opcional)
app.get('/send-test', async (req, res) => {
    const phoneNumber = req.query.phone || TARGET_PHONE; // Permitir especificar teléfono o usar el predeterminado
    const message = req.query.msg || "Hi There! (Test)"; // Permitir especificar mensaje o usar predeterminado

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Parámetro "phone" es requerido.' });
    }

    try {
        const result = await sendTextMessage(phoneNumber, message);
        if (result) {
            return res.status(200).json({ success: true, message: 'Mensaje enviado exitosamente.', data: result });
        } else {
            return res.status(500).json({ success: false, message: 'Error al enviar el mensaje.' });
        }
    } catch (error) {
        console.error('Error en /send-test:', error.message);
        return res.status(500).json({ success: false, message: 'Error interno al intentar enviar el mensaje.', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de prueba escuchando en el puerto ${PORT}`);
    console.log(`Webhook URL: https://<tu-dominio>.onrender.com/webhook`);
    console.log(`Test Send URL: https://<tu-dominio>.onrender.com/send-test?phone=5213311296199&msg=Hola%20de%20prueba`);
});

// Cambio insignificante para forzar nuevo deploy