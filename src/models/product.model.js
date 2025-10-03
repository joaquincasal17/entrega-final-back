import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  code: String,
  price: { type: Number, required: true },
  status: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  category: String,
  thumbnails: [String]
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
