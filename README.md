# Shop API - Entrega completa

Contenido:
- API REST para /api/products y /api/carts
- Persistencia por archivos (products.json / carts.json) mediante ProductManager y CartManager
- Vistas con Handlebars: home, realtimeproducts, products index, product detail, cart view
- Websockets (Socket.io) para actualizar realtimeproducts automáticamente
- Preparado para migrar a MongoDB (modelos en /src/models) y usar MONGODB_URI si lo desea

## Instrucciones rápidas

1. Descargar y descomprimir el proyecto.
2. Ejecutar `npm install`.
3. Ejecutar `npm run start` (o `npm run dev` si tiene nodemon).
4. Abrir `http://localhost:8080/` para la vista principal.
5. Usar Postman o la vista para probar endpoints.

## Archivos importantes
- `src/server.js` - arranca Express y Socket.io
- `src/routes/products.router.js` - rutas /api/products
- `src/routes/carts.router.js` - rutas /api/carts
- `src/managers/ProductManager.js` - persistencia en JSON
- `src/managers/CartManager.js` - persistencia en JSON
- `views/` - plantillas handlebars

## Nota sobre MongoDB
Si quiere usar MongoDB como persistencia final:
- configurar `MONGODB_URI` en el entorno
- las rutas están pensadas para mantener la misma lógica; puede reemplazar los managers por los modelos en `/src/models`



## Uso con MongoDB (Entrega Final)
Si querés que el proyecto use MongoDB como persistencia (requisito de la entrega final):

1. Instalar MongoDB y dejarlo corriendo o usar un servicio en la nube.
2. Crear un archivo `.env` con `MONGODB_URI` (o usar la línea de comandos).
3. Ejecutar `npm install`.
4. Ejecutar `npm run seed` para cargar productos de ejemplo.
5. Ejecutar `npm run start` (o `npm run start:mongo`) y el servidor utilizará Mongo si detecta la variable `MONGODB_URI`.

Las rutas mantienen la misma estructura y lógica; si hay conexión a Mongo, se usa Mongoose y los `populate` para los carritos.
