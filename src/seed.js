import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/product.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop';

const sample = [
  { title: 'Camiseta', description: 'Camiseta algodon', code: 'C001', price: 1200, status: true, stock: 20, category: 'ropa', thumbnails: [] },
  { title: 'Pantalon', description: 'Pantalon jean', code: 'C002', price: 3500, status: true, stock: 10, category: 'ropa', thumbnails: [] },
  { title: 'Zapatos', description: 'Zapatos deportivos', code: 'C003', price: 8000, status: true, stock: 5, category: 'calzado', thumbnails: [] }
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to', MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(sample);
  console.log('Seeded products');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
