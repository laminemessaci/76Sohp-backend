const { Product } = require("../models/product");
const express = require("express");
const colors = require("colors");
const { Category } = require("../models/category");
const mongoose = require("mongoose");
const multer = require("multer");
const router = express.Router();
const { deleteUploadedFile } = require("../utils/uploads");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  /**
   * Generates the destination for the uploaded file based on its extension.
   *
   * @param {Object} req - The request object.
   * @param {Object} file - The uploaded file object.
   * @param {Function} callback - The callback function.
   * @return {String} The destination path for the file.
   */
  destination: (req, file, callback) => {
    const allowedExtensions = ["jpg", "jpeg", "png", "gif"];
    const fileExtension = file.originalname.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      callback(new Error("Only image files are allowed!"), false);
    } else {
      callback(null, "public/uploads");
    }
  },
  /**
   * Generates a file name for the given request file and callback.
   *
   * @param {Object} req - The request object.
   * @param {Object} file - The file object.
   * @param {Function} cb - The callback function.
   * @return {string} The generated file name.
   */
  filename: (req, file, cb) => {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];

    console.log(extension);
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

// GET ALL PRODUCTS
// /api/v1/products
router.get(`/`, async (req, res) => {
  const filter = req.query.categories
    ? { category: req.query.categories.split(",") }
    : {};
  const productList = await Product.find({ ...filter }).populate("category");

  if (!productList) {
    res.status(500).json({ success: false });
  }
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    res
      .status(500)
      .json({ message: "The product with the given ID was not found." });
  }

  res.status(200).send(product);
});

// POST PRODUCT
// /api/v1/products
router.patch(`/:id`, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product Id");
  }
  const category = await Category.findById(req.body.category).exec();
  if (!category) return res.status(400).send("Invalid Category");

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(400).send("Invalid Product");

  const file = req.file;
  let imagepath;

  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    imagepath = `${basePath}${fileName}`;
  } else {
    imagepath = product.image;
  }

  try {
    product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        image: req.body.image,
        description: req.body.description,
        richDescription: req.body.richDescription,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
      },
      { new: true }
    );
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: `Internal server error! ${err}` });
  }

  if (!product) return res.status(500).send("the product cannot be updated!");
  res.status(201).send(product);
});

// CREATE PRODUCT
// /api/v1/products
router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.category)) {
    deleteUploadedFile(req);

    return res.status(400).send("Invalid Category Id");
  }
  const category = await Category.findById(req.body.category).exec();
  if (!category) {
    deleteUploadedFile(req);
    return res.status(400).send("Invalid Category");
  }

  const file = req.file;
  if (!file) return res.status(400).send("No image in the request");

  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  let product = null;

  try {
    product = new Product({
      name: req.body.name,
      image: `${basePath}${fileName}`,
      description: req.body.description,
      richDescription: req.body.richDescription,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    });
  } catch (err) {
    deleteUploadedFile(req.file);
    return res
      .status(500)
      .json({ success: false, message: `Internal server error! ${err}` });
  }

  await product.save();

  if (!product) return res.status(500).send("the product cannot be created!");

  res.status(201).send(product);
});

// DELETE PRODUCT
// /api/v1/products/:id
router.delete(`/products/:productId`, (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "the product is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "product not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// GET COUNT OF PRODUCTS
// /api/v1/products/get/count
router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    productCount: productCount,
  });
});

// GET FEATURED PRODUCTS
// /api/v1/products/get/featured/:count
router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(+count);

  if (!products) {
    res.status(500).json({ success: false });
  }

  res.send(products);
});

// GET ALL PRODUCTS
// /api/v1/products/get/featured
router.get(`/get/featured`, async (req, res) => {
  const products = await Product.find({ isFeatured: true });

  if (!products) {
    res.status(500).json({ success: false });
  }

  res.send(products);
});

module.exports = router;
