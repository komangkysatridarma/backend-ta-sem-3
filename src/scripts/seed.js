import "dotenv/config";
import { connectDatabase } from "../config/db.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { seedProducts } from "../data/seedProducts.js";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI belum di-set");
    process.exit(1);
  }

  await connectDatabase(uri);

  await Product.deleteMany({});
  await Product.insertMany(seedProducts);
  console.log(`Seed ${seedProducts.length} produk`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@ruangrasa.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: "Admin Ruang Rasa",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      phone: "08123456789",
    });
    console.log(`Admin dibuat: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin sudah ada, dilewati");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
