import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductManager from '../managers/ProductManager.js';
import CartManager from '../managers/CartManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pm = new ProductManager(path.join(__dirname, '..', 'data', 'products.json'));
const cm = new CartManager(path.join(__dirname, '..', 'data', 'carts.json'));

const router = express.Router();

router.get('/', async (req, res) => {
  const r = await pm.getProducts({ limit: 10, page: 1 });
  res.render('home', { products: r.payload });
});

router.get('/products', async (req, res) => {
  const { limit=10, page=1, sort, query } = req.query;
  const r = await pm.getProducts({ limit: Number(limit), page: Number(page), sort, query });
  res.render('products/index', { products: r.payload, pagination: r });
});

router.get('/products/:pid', async (req, res) => {
  const p = await pm.getProductById(req.params.pid);
  if (!p) return res.status(404).send('Producto no encontrado');
  res.render('products/detail', { product: p });
});

router.get('/realtimeproducts', async (req, res) => {
  const all = await pm.getProducts({ limit: 1000 });
  res.render('realtimeproducts', { products: all.payload });
});

router.get('/carts/:cid', async (req, res) => {
  const cart = await cm.getCartById(req.params.cid);
  if (!cart) return res.status(404).send('Carrito no encontrado');
  // For file-based persistence we stored product ids; to "populate", fetch product details
  const populated = [];
  for (const item of cart.products) {
    const prod = await pm.getProductById(item.product);
    if (prod) populated.push({ ...prod, quantity: item.quantity });
  }
  res.render('carts/detail', { products: populated, cartId: cart.id });
});

export default function() {
  return router;
}
