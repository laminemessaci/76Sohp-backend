const { Order } = require("../models/order");
const express = require("express");
const router = express.Router();
const colors = require("colors");
const { OrderItem } = require("../models/orderItem");

// GET ALL ORDERS
// /api/v1/orders
router.get(`/`, async (req, res) => {
  const orderList = await Order.find().populate("user", "name").sort({
    dateOrdered: -1,
  });

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });

  if (!order) {
    res
      .status(500)
      .json({ message: "The order with the given ID was not found." });
  }

  res.status(200).send(order);
});

// POST ORDER
// /api/v1/orders
router.post(`/`, async (req, res) => {
  // console.log(colors.green(req.body.orderItems));
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );

  const ResolvedOrderItemsIds = await orderItemsIds;
  // console.log(colors.magenta(ResolvedOrderItemsIds));

  const totalPrices = await Promise.all(
    ResolvedOrderItemsIds.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );

  // console.log(colors.bgBlue(totalPrices));
  const totalOrderPrice = totalPrices.reduce((a, b) => a + b, 0);

  const order = new Order({
    orderItems: ResolvedOrderItemsIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalOrderPrice,
    user: req.body.user,
    dateOrdered: req.body.dateOrdered,
  });

  order
    .save()
    .then((order) => {
      if (!order) {
        return res.status(400).send("the order cannot be created!");
      }
      res.send(order);
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
});

// PATCH ORDER
// /api/v1/orders
router.patch(`/:id`, async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!order) {
    return res.status(500).send("the order cannot be created!");
  }

  res.status(201).send(order);
});

router.delete(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.orderItems.map(async (orderItem) => {
      const orderItemToDelete = await OrderItem.findById(orderItem._id);
      if (orderItemToDelete) {
        await orderItemToDelete.deleteOne();
      }
    });

    await order.deleteOne();

    return res
      .status(200)
      .json({ success: true, message: "the order is deleted!" });
  } else {
    return res
      .status(404)
      .json({ success: false, message: "order not found!" });
  }
});

// GET ORDER COUNT
// /api/v1/orders/get/count
router.get(`/get/count`, async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    orderCount: orderCount,
  });
});

// GET USER ORDERS
// /api/v1/orders/get/userorders/:userid
router.get(`/get/userorders/:userid`, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({
      dateOrdered: -1,
    });

  if (!userOrderList) {
    res.status(500).json({ success: false });
  }

  res.status(200).send(userOrderList);
});

module.exports = router;
