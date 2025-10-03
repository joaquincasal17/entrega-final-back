import express from 'express';
import CartManager from '../managers/CartManager.js';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import CartModel from '../models/cart.model.js';
import ProductModel from '../models/product.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cm = new CartManager(path.join(__dirname, '..', 'data', 'carts.json'));

export default function() {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const cart = await CartModel.create({ products: [] });
        return res.status(201).json({ status: 'success', payload: cart });
      } else {
        const cart = await cm.createCart();
        return res.status(201).json({ status: 'success', payload: cart });
      }
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  router.get('/:cid', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const cart = await CartModel.findById(req.params.cid).populate('products.product').lean();
        if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });
        return res.json({ status: 'success', payload: cart });
      } else {
        const cart = await cm.getCartById(req.params.cid);
        if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });
        return res.json({ status: 'success', payload: cart });
      }
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  router.post('/:cid/product/:pid', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const cart = await CartModel.findById(req.params.cid);
        if (!cart) throw new Error('Cart not found');
        const prod = await ProductModel.findById(req.params.pid);
        if (!prod) throw new Error('Product not found');

        const item = cart.products.find(p => String(p.product) === String(req.params.pid));
        if (item) item.quantity += 1;
        else cart.products.push({ product: prod._id, quantity: 1 });

        await cart.save();
        const populated = await cart.populate('products.product').execPopulate();
        return res.json({ status: 'success', payload: populated });
      } else {
        const cart = await cm.addProductToCart(req.params.cid, req.params.pid);
        return res.json({ status: 'success', payload: cart });
      }
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // DELETE api/carts/:cid/products/:pid
  router.delete('/:cid/products/:pid', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const cart = await CartModel.findById(req.params.cid);
        if (!cart) throw new Error('Cart not found');
        cart.products = cart.products.filter(p => String(p.product) !== String(req.params.pid));
        await cart.save();
        const populated = await cart.populate('products.product').execPopulate();
        return res.json({ status: 'success', payload: populated });
      } else {
        const cart = await cm.removeProductFromCart(req.params.cid, req.params.pid);
        return res.json({ status: 'success', payload: cart });
      }
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // PUT api/carts/:cid -> replace products array
  router.put('/:cid', async (req, res) => {
    try {
      const productsArray = req.body.products || [];
      if (mongoose.connection.readyState === 1) {
        const cart = await CartModel.findById(req.params.cid);
        if (!cart) throw new Error('Cart not found');
        // Expect productsArray items: { product: productId, quantity }
        cart.products = productsArray.map(p => ({ product: p.product, quantity: p.quantity }));
        await cart.save();
        const populated = await cart.populate('products.product').execPopulate();
        return res.json({ status: 'success', payload: populated });
      } else {
        const cart = await cm.updateCartProducts(req.params.cid, productsArray);
        return res.json({ status: 'success', payload: cart });
      }
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // PUT api/carts/:cid/products/:pid -> update quantity only
  router.put('/:cid/products/:pid', async (req, res) => {
    try {
      const qty = Number(req.body.quantity);
      if (isNaN(qty)) throw new Error('Invalid quantity');
      if (mongoose.connection.readyState === 1) {
        const cart = await CartModel.findById(req.params.cid);
        if (!cart) throw new Error('Cart not found');
        const item = cart.products.find(p => String(p.product) === String(req.params.pid));
        if (!item) throw new Error('Product not in cart');
        item.quantity = qty;
        await cart.save();
        const populated = await cart.populate('products.product').execPopulate();
        return res.json({ status: 'success', payload: populated });
      } else {
        const cart = await cm.updateProductQuantity(req.params.cid, req.params.pid, qty);
        return res.json({ status: 'success', payload: cart });
      }
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // DELETE api/carts/:cid -> empty cart
  router.delete('/:cid', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const cart = await CartModel.findById(req.params.cid);
        if (!cart) throw new Error('Cart not found');
        cart.products = [];
        await cart.save();
        return res.json({ status: 'success', payload: cart });
      } else {
        const cart = await cm.emptyCart(req.params.cid);
        return res.json({ status: 'success', payload: cart });
      }
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  return router;
}
