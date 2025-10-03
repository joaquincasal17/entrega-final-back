import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export default class CartManager {
  constructor(path) {
    this.path = path;
  }

  async _readFile() {
    try {
      const data = await fs.readFile(this.path, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  async _writeFile(data) {
    await fs.mkdir(require('path').dirname(this.path), { recursive: true });
    await fs.writeFile(this.path, JSON.stringify(data, null, 2), 'utf-8');
  }

  async createCart() {
    const all = await this._readFile();
    const cart = { id: uuidv4(), products: [] };
    all.push(cart);
    await this._writeFile(all);
    return cart;
  }

  async getCartById(cid) {
    const all = await this._readFile();
    return all.find(c => c.id === cid);
  }

  async addProductToCart(cid, pid) {
    const all = await this._readFile();
    const cart = all.find(c => c.id === cid);
    if (!cart) throw new Error('Cart not found');
    const item = cart.products.find(p => p.product === pid);
    if (item) {
      item.quantity += 1;
    } else {
      cart.products.push({ product: pid, quantity: 1 });
    }
    await this._writeFile(all);
    return cart;
  }

  async removeProductFromCart(cid, pid) {
    const all = await this._readFile();
    const cart = all.find(c => c.id === cid);
    if (!cart) throw new Error('Cart not found');
    cart.products = cart.products.filter(p => p.product !== pid);
    await this._writeFile(all);
    return cart;
  }

  async updateCartProducts(cid, productsArray) {
    const all = await this._readFile();
    const cart = all.find(c => c.id === cid);
    if (!cart) throw new Error('Cart not found');
    cart.products = productsArray;
    await this._writeFile(all);
    return cart;
  }

  async updateProductQuantity(cid, pid, qty) {
    const all = await this._readFile();
    const cart = all.find(c => c.id === cid);
    if (!cart) throw new Error('Cart not found');
    const item = cart.products.find(p => p.product === pid);
    if (!item) throw new Error('Product not in cart');
    item.quantity = qty;
    await this._writeFile(all);
    return cart;
  }

  async emptyCart(cid) {
    const all = await this._readFile();
    const cart = all.find(c => c.id === cid);
    if (!cart) throw new Error('Cart not found');
    cart.products = [];
    await this._writeFile(all);
    return cart;
  }
}
