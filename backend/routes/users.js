const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// GET ALL USERS
// /api/v1/users
router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

// POST USER
// /api/v1/users
router.post(`/register`, async (req, res) => {
  let findUser = await User.findOne({ email: req.body.email });
  if (findUser) return res.status(400).send("User already registered.");

  let user = null;
  if (req.body.password) {
    user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
    });
  }

  user = await user.save();

  if (!user) return res.status(400).send("the user cannot be created!");

  res.status(201).send(user);
});

// GET USER BY ID
// /api/v1/users/:id
router.get(`/:id`, async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    res
      .status(500)
      .json({ message: "The user with the given ID was not found." });
  }

  res.status(200).send(user);
});

// DELETE USER
// /api/v1/users/:id
router.delete(`/:id`, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      return res
        .status(200)
        .json({ success: true, message: "the user is deleted!" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "user not found!" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: `Internal server error! ${error}` });
  }
});

// PATCH USER
// /api/v1/users/:id
router.patch(`/:id`, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        // Add the properties you want to update here
      },
      { new: true }
    );

    if (user) {
      return res
        .status(200)
        .json({ success: true, message: "the user is updated!" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "user not found!" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: `Internal server error! ${error}` });
  }
});

// LOGIN
// /api/v1/users/login
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).send({ message: "User not found." });
  }

  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.SECRET,
      {
        expiresIn: "1d",
      }
    );
    return res
      .status(200)
      .send({ user: user.email, isAdmin: user.isAdmin, token: token });
  } else if (
    user &&
    !bcrypt.compareSync(req.body.password, user.passwordHash)
  ) {
    return res.status(400).send({ message: "Password or email is incorrect." });
  }
});

// GET USER COUNT
// /api/v1/users/get/count
router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount,
  });
});

module.exports = router;
