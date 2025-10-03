import express from 'express';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import exphbs from 'express-handlebars';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';
import ProductManager from './managers/ProductManager.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new IOServer(httpServer);

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Handlebars
app.engine('handlebars', exphbs.create({}).engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '..', 'views'));

// connect to mongo if MONGODB_URI provided
const MONGODB_URI = process.env.MONGODB_URI || null;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
  }).catch(err => {
    console.error('MongoDB connection error:', err);
  });
}

// routers
app.use('/api/products', productsRouter(io)); // router handles fallback to mongoose or file
app.use('/api/carts', cartsRouter());
app.use('/', viewsRouter());

// sockets
const productManager = new ProductManager(path.join(__dirname, '..', 'data', 'products.json'));

io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);
  // send current products - if using mongoose, routes will emit updated lists when changes occur
  const products = await productManager.getProducts({ limit: 1000 });
  socket.emit('products', products.payload ? products.payload : products);
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
