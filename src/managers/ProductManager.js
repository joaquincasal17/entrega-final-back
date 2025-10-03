import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export default class ProductManager {
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

  async getProducts({ limit = 10, page = 1, sort, query } = {}) {
    const all = await this._readFile();
    let results = all;

    // query filter: category or status (available)
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(p => (p.category && p.category.toLowerCase().includes(q)) || (String(p.status).toLowerCase() === q));
    }

    // sort by price asc/desc
    if (sort === 'asc' || sort === 'desc') {
      results = results.sort((a,b) => (a.price - b.price) * (sort === 'asc' ? 1 : -1));
    }

    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage -1) * limit;
    const payload = results.slice(start, start + limit);

    return {
      status: 'success',
      payload,
      totalPages,
      prevPage: currentPage > 1 ? currentPage -1 : null,
      nextPage: currentPage < totalPages ? currentPage +1 : null,
      page: currentPage,
      hasPrevPage: currentPage > 1,
      hasNextPage: currentPage < totalPages
    };
  }

  async getProductById(pid) {
    const all = await this._readFile();
    return all.find(p => p.id === pid);
  }

  async addProduct(product) {
    const all = await this._readFile();
    // minimal validation
    const required = ['title','description','code','price','status','stock','category'];
    for (const r of required) {
      if (product[r] === undefined) throw new Error(`Missing field ${r}`);
    }
    const newP = {
      id: uuidv4(),
      thumbnails: product.thumbnails || [],
      ...product
    };
    all.push(newP);
    await this._writeFile(all);
    return newP;
  }

  async updateProduct(pid, changes) {
    const all = await this._readFile();
    const idx = all.findIndex(p => p.id === pid);
    if (idx === -1) throw new Error('Product not found');
    // prevent id change
    delete changes.id;
    all[idx] = { ...all[idx], ...changes };
    await this._writeFile(all);
    return all[idx];
  }

  async deleteProduct(pid) {
    const all = await this._readFile();
    const idx = all.findIndex(p => p.id === pid);
    if (idx === -1) throw new Error('Product not found');
    const [removed] = all.splice(idx,1);
    await this._writeFile(all);
    return removed;
  }
}
