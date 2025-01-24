// const db = require('../models/users')
const message = require('../helpers/message')
const { generateToken } = require('../middlewares/auth')
const db = require('../models/db')
const Users = db.users;
const usercarts = db.usercarts;
const Sequelize = db.sequelize;
const Op = db.Op;
const UsersCartService = require('../services/usercartService')


exports.addToCart = async (req, res) => {
    console.log(req.body.cartData);
    const loggedInUserId = req.user.id; // User ID from token
    const userType = req.user.userType; // User Type from token
    console.log(userType);
  
    const {
      PId,
      quantity,
      price,
      MRP,
      PTR,
      sch_Per,
      cD_Per,
      iGST_Per,
      cGST_Per,
      sGST_Per,
      gCESS_Per,
      grsAmt,
      netAmt,
      wPAmt,
      schAmt,
      cDAmt,
      gSTAmt,
      gCESSAmt,
      taxable,
      stockId,
      orderTo,
    } = req.body.cartData;
  
    try {
      // Check if an entry with the same PId and stockId exists
      const existingEntry = await usercarts.findOne({
        where: {
          PId,
          stockId,
          orderFrom: loggedInUserId, // Ensure it's scoped to the logged-in user
        },
      });
  
      if (existingEntry) {
        // If it exists, update the quantity
        existingEntry.quantity = quantity; // Increment quantity
        existingEntry.netAmt = netAmt;
        existingEntry.grsAmt = grsAmt;
        await existingEntry.save();
  
        return res.status(200).json({
          message: "Cart item updated successfully.",
          cart: existingEntry,
        });
      } else {
        // If it doesn't exist, create a new entry
        const newEntry = await usercarts.create({
          PId,
          quantity,
          price,
          MRP,
          PTR,
          sch_Per,
          cD_Per,
          iGST_Per,
          cGST_Per,
          sGST_Per,
          gCESS_Per,
          grsAmt,
          netAmt,
          wPAmt,
          schAmt,
          cDAmt,
          gSTAmt,
          gCESSAmt,
          taxable,
          stockId,
          orderFrom: loggedInUserId,
          orderTo,
        });
  
        return res.status(201).json({
          message: "Item added to cart successfully.",
          cart: newEntry,
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      return res.status(500).json({ message: "Process failed.", error: error.message });
    }
};

exports.discardCart= async (req, res) => {
  const loggedInUserId = req.user.id; // User ID from token

  try {
    // Delete all items from the cart for the logged-in user
    const deletedItemsCount = await usercarts.destroy({
      where: {
        orderFrom: loggedInUserId,
      },
    });

    if (deletedItemsCount > 0) {
      return res.status(200).json({
        message: "Cart discarded successfully.",
        itemsDiscarded: deletedItemsCount,
      });
    } else {
      return res.status(404).json({
        message: "No items found in the cart to discard.",
      });
    }
  } catch (error) {
    console.error("Error discarding cart:", error);
    return res.status(500).json({ message: "Failed to discard cart.", error: error.message });
  }
};

exports.deleteCartItem = async (req, res) => {
    const loggedInUserId = req.user.id; // User ID from token
    const { cartItemId } = req.params; // Cart item ID from request parameters
  
    try {
      // Find the cart item to ensure it belongs to the logged-in user
      const cartItem = await usercarts.findOne({
        where: {
          id: cartItemId,
          orderFrom: loggedInUserId,
        },
      });
  
      if (!cartItem) {
        return res.status(404).json({
          message: "Cart item not found or does not belong to the logged-in user.",
        });
      }
  
      // Delete the cart item
      await usercarts.destroy({
        where: {
          id: cartItemId,
        },
      });
  
      return res.status(200).json({
        message: "Cart item deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting cart item:", error);
      return res.status(500).json({ message: "Failed to delete cart item.", error: error.message });
    }
};

exports.getUserCart = async (req, res) => {
    const loggedInUserId = req.user.id; // User ID from token
  
    try {
      // Fetch all items in the cart for the logged-in user
      const cartItems = await usercarts.findAll({
        where: {
          orderFrom: loggedInUserId,
        },
        include: [
          {
            model: db.products, // Include associated product details if needed
            as: "productDetails",
            attributes: ["PName"], // Adjust fields as per your database schema
          },
        ],
      });
  
      // Check if the cart is empty
      if (!cartItems.length) {
        return res.status(200).json({
          message: "Your cart is empty.",
          cart: [],
        });
      }
  
      return res.status(200).json({
        message: "Cart fetched successfully.",
        cart: cartItems,
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      return res.status(500).json({ message: "Failed to fetch cart.", error: error.message });
    }
};
  
  

  



