// setup/init.js
require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');

const init = async () => {
  try {
    await connectDB();
    console.log('DB Connected ✅');

    // 1. Ensure admin exists
    const adminEmail = 'admin@example.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = await User.create({
        name: 'Admin',
        email: "admin@gmail.com",
        password: 'password123', // hash middleware in User model will hash this
        role: 'admin'
      });
      console.log('Admin created ✅');
    } else {
      console.log('Admin already exists ✅');
    }

    // 2. Ensure categories exist
    const categories = [
      { name: 'Engagement Rings', slug: 'engagement-rings', description: 'Rings for proposals' },
      { name: 'Wedding Bands', slug: 'wedding-bands', description: 'Bands for weddings' },
      { name: 'Loose Diamonds', slug: 'loose-diamonds', description: 'High quality loose diamonds' },
      { name: 'Gemstones', slug: 'gemstones', description: 'Precious and semi-precious gemstones' },
      { name: 'Gifts', slug: 'gifts', description: 'Jewelry gift collection' }
    ];

    for (const cat of categories) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (!exists) {
        await Category.create(cat);
        console.log(`Category "${cat.name}" created ✅`);
      } else {
        console.log(`Category "${cat.name}" already exists ✅`);
      }
    }

    console.log('Setup completed 🎉');
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
  }
};

init();



// // seed/seed.js
// require('dotenv').config();
// const connectDB = require('../config/db');
// const mongoose = require('mongoose');
// const User = require('../models/User');
// const Category = require('../models/Category');
// const Product = require('../models/Product');
// const Diamond = require('../models/Diamond');

// const seed = async () => {
//   try {
//     await connectDB();
//     console.log('Seeding...');

//     // remove old
//     await User.deleteMany();
//     await Category.deleteMany();
//     await Product.deleteMany();
//     await Diamond.deleteMany();

//     const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' });
//     const user = await User.create({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

//     const cat1 = await Category.create({ name: 'Engagement Rings', slug: 'engagement-rings', description: 'Rings for proposals' });
//     const cat2 = await Category.create({ name: 'Wedding Bands', slug: 'wedding-bands', description: 'Bands for wedding' });
//     const cat3 = await Category.create({
//       name: 'Loose Diamonds',
//       slug: 'loose-diamonds',
//       description: 'Certified loose diamonds in various shapes and sizes'
//     });
//     const cat4 = await Category.create({
//       name: 'Gemstones',
//       slug: 'gemstones',
//       description: 'Colorful gemstones for custom jewelry'
//     });
//     const cat5 = await Category.create({
//       name: 'Gifts',
//       slug: 'gifts',
//       description: 'Jewelry gifts for special occasions'
//     });
    
//     await Product.create([
//       {
//         title: 'Classic Solitaire Setting',
//         slug: 'classic-solitaire-setting',
//         description: 'A timeless solitaire setting.',
//         category: cat1._id,
//         price: 700,
//         metalOptions: ['14K White Gold', '18K Yellow Gold', 'Platinum'],
//         availableShapes: ['Round', 'Oval'],
//         features: ['Prong-set'],
//         images: [],
//         stock: 10,
//         isCustomizable: true,
//         createdBy: admin._id
//       },
//       {
//         title: 'Vintage Halo Setting',
//         slug: 'vintage-halo-setting',
//         description: 'Intricate vintage halo.',
//         category: cat1._id,
//         price: 950,
//         metalOptions: ['14K Rose Gold', '18K White Gold'],
//         availableShapes: ['Cushion', 'Princess'],
//         features: ['Halo', 'Pavé'],
//         images: [],
//         stock: 5,
//         createdBy: admin._id
//       }
//     ]);

//     await Diamond.create([
//       { sku: 'DIA-001', shape: 'Round', carat: 0.5, cut: 'Excellent', clarity: 'VS1', color: 'G', labGrown: false, price: 1200, stock: 5, certificate: 'GIA-001' },
//       { sku: 'DIA-002', shape: 'Oval', carat: 1.0, cut: 'Very Good', clarity: 'SI1', color: 'H', labGrown: true, price: 900, stock: 3, certificate: 'IGI-002' }
//     ]);

//     console.log('Seeding done.');
//     mongoose.connection.close();
//   } catch (err) {
//     console.error(err);
//     mongoose.connection.close();
//   }
// };

// seed();
