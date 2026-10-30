/** Format dokumen produk agar cocok dengan shape frontend (id numerik). */
export function formatProduct(doc) {
  if (!doc) return null;
  const product = doc.toObject ? doc.toObject() : doc;
  return {
    id: product.productId,
    name: product.name,
    category: product.category,
    price: product.price,
    image: product.image,
    description: product.description,
    isAvailable: product.isAvailable ?? true,
  };
}

export function formatProducts(docs) {
  return docs.map((doc) => formatProduct(doc));
}
