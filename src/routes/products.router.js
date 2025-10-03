import express from 'express';
import ProductManager from '../managers/ProductManager.js';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductModel from '../models/product.model.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pm = new ProductManager(path.join(__dirname, '..', 'data', 'products.json'));

function buildLinks(req, result, limit, sort, query) {
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
  result.prevLink = result.hasPrevPage ? `${baseUrl}?limit=${limit}&page=${result.prevPage}${sort?`&sort=${sort}`:''}${query?`&query=${query}`:''}` : null;
  result.nextLink = result.hasNextPage ? `${baseUrl}?limit=${limit}&page=${result.nextPage}${sort?`&sort=${sort}`:''}${query?`&query=${query}`:''}` : null;
}

export default function(io) {
  const router = express.Router();

  // GET / -> supports mongo if connected
  router.get('/', async (req, res) => {
    const { limit=10, page=1, sort, query } = req.query;
    const lim = Number(limit), pg = Number(page);
    try {
      if (mongoose.connection.readyState === 1) {
        // build filter
        const filter = {};
        if (query) {
          const q = query.toLowerCase();
          // allow search by category or status=true/false
          if (q === 'true' || q === 'false') filter.status = q === 'true';
          else filter.category = { $regex: q, $options: 'i' };
        }
        const sortObj = {};
        if (sort === 'asc') sortObj.price = 1;
        if (sort === 'desc') sortObj.price = -1;

        const total = await ProductModel.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(total / lim));
        const currentPage = Math.min(Math.max(1, pg), totalPages);
        const products = await ProductModel.find(filter)
          .sort(sortObj)
          .skip((currentPage-1)*lim)
          .limit(lim)
          .lean();

        const result = {
          status: 'success',
          payload: products,
          totalPages,
          prevPage: currentPage > 1 ? currentPage -1 : null,
          nextPage: currentPage < totalPages ? currentPage +1 : null,
          page: currentPage,
          hasPrevPage: currentPage > 1,
          hasNextPage: currentPage < totalPages
        };
        buildLinks(req, result, lim, sort, query);
        return res.json(result);
      } else {
        const result = await pm.getProducts({ limit: lim, page: pg, sort, query });
        // build links
        buildLinks(req, result, lim, sort, query);
        return res.json(result);
      }
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  router.get('/:pid', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const p = await ProductModel.findById(req.params.pid).lean();
        if (!p) return res.status(404).json({ status:'error', message: 'Not found' });
        return res.json({ status: 'success', payload: p });
      } else {
        const p = await pm.getProductById(req.params.pid);
        if (!p) return res.status(404).json({ status:'error', message: 'Not found' });
        return res.json({ status: 'success', payload: p });
      }
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const created = await ProductModel.create(req.body);
        const all = await ProductModel.find().lean();
        if (io) io.emit('products', all);
        return res.status(201).json({ status: 'success', payload: created });
      } else {
        const newP = await pm.addProduct(req.body);
        if (io) io.emit('products', await pm.getProducts({ limit: 1000 }));
        return res.status(201).json({ status: 'success', payload: newP });
      }
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  router.put('/:pid', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const updated = await ProductModel.findByIdAndUpdate(req.params.pid, req.body, { new: true }).lean();
        const all = await ProductModel.find().lean();
        if (io) io.emit('products', all);
        return res.json({ status: 'success', payload: updated });
      } else {
        const updated = await pm.updateProduct(req.params.pid, req.body);
        if (io) io.emit('products', await pm.getProducts({ limit: 1000 }));
        return res.json({ status: 'success', payload: updated });
      }
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  router.delete('/:pid', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const removed = await ProductModel.findByIdAndDelete(req.params.pid).lean();
        const all = await ProductModel.find().lean();
        if (io) io.emit('products', all);
        return res.json({ status: 'success', payload: removed });
      } else {
        const removed = await pm.deleteProduct(req.params.pid);
        if (io) io.emit('products', await pm.getProducts({ limit: 1000 }));
        return res.json({ status: 'success', payload: removed });
      }
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  return router;
}
