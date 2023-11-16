const express = require("express");
require("dotenv").config();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const colors = require("colors");

const authJwt = require("./middlewares/jwt.js");
const errorHandler = require("./middlewares/errorHandler.js");
const app = express();

const api = process.env.API_URL;

app.use(cors());
app.options("*", cors());

//middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt);
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errorHandler);

//Routes
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");

app.use(`${api}/categories`, categoriesRoutes);

app.use(`${api}/products`, productsRoutes);
app.use(`${api}/products/:productId`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

mongoose
  .connect(process.env.DB_CONNECTION, {})
  .then(() => {
    console.log(colors.bgGreen("Database connected"));
    app.listen(3000, () => {
      console.log("Server started on port 3000");
    });
  })
  .catch((err) => {
    console.log(colors.bgRed.white("Database error"), err);
    process.exit(1);
  });
