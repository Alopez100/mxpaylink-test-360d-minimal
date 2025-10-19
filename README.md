# Ejemplo Mínimo para Prueba con 360Dialog

Este proyecto es un ejemplo muy simple para aislar y demostrar un problema de envío de mensajes desde una aplicación alojada en Render hacia la API de 360Dialog.

## Funcionalidad

- Recibe un webhook de 360Dialog en `/webhook`.
- Valida el webhook usando `WEBHOOK_VERIFY_TOKEN`.
- Si recibe un mensaje de texto "hello" desde el número `5213311296199`, responde con "Hi There!".
- Tiene un endpoint `/send-test` para probar envío manual.

## Configuración

1.  Copia este directorio completo.
2.  Crea un archivo `.env` en la raíz con las siguientes variables:
    - `WHATSAPP_API_BASE_URL`: `https://waba-v2.360dialog.io`
    - `WHATSAPP_TOKEN`: Tu clave de API de 360Dialog (D360-API-KEY).
    - `WHATSAPP_PHONE_ID`: Tu phone_number_id de 360Dialog.
    - `WEBHOOK_VERIFY_TOKEN`: `mxpaylink_test_simple_2025` (o el que hayas definido).
    - `TARGET_PHONE_NUMBER`: `5213311296199`
3.  Instala dependencias: `npm install`
4.  Inicia la aplicación: `npm start`

## Despliegue en Render

1.  Crea un nuevo repositorio en GitHub/GitLab con estos archivos.
2.  Crea un nuevo servicio Web en Render conectado a ese repositorio.
3.  Configura las variables de entorno en Render (iguales al `.env`).
4.  Asegúrate de que el puerto sea `10000` (definido en `app.js`).
5.  Configura el webhook en 360Dialog para apuntar a `https://<tu-app-render>.onrender.com/webhook` con el `WEBHOOK_VERIFY_TOKEN` correspondiente.

## Uso para Demostrar el Problema

1.  Despliega la aplicación en Render.
2.  Configura el webhook en 360Dialog.
3.  Verifica que la recepción de mensajes funciona (el log mostrará el mensaje recibido).
4.  Observa si ocurre el timeout al intentar enviar la respuesta "Hi There!" (el log mostrará `Timeout al enviar mensaje...`).
5.  Este timeout es el problema que se desea resolver.