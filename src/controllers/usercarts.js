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
    // // console.log(req.body.cartData);
    // const loggedInUserId = req.user.id; // User ID from token
    // const userType = req.user.userType; // User Type from token
    // console.log(userType);
  
    // const {
    //   PId,
    //   quantity,
    //   price,
    //   MRP,
    //   PTR,
    //   sch_Per,
    //   cD_Per,
    //   iGST_Per,
    //   cGST_Per,
    //   sGST_Per,
    //   gCESS_Per,
    //   grsAmt,
    //   netAmt,
    //   wPAmt,
    //   schAmt,
    //   cDAmt,
    //   gSTAmt,
    //   gCESSAmt,
    //   taxable,
    //   stockId,
    //   orderTo,
    // } = req.body.cartData;
  
    // try {
    //   // Check if an entry with the same PId and stockId exists
    //   const existingEntry = await usercarts.findOne({
    //     where: {
    //       PId,
    //       stockId,
    //       orderFrom: loggedInUserId, // Ensure it's scoped to the logged-in user
    //     },
    //   });
  
    //   if (existingEntry) {
    //     // If it exists, update the quantity
    //     existingEntry.quantity = quantity; // Increment quantity
    //     existingEntry.netAmt = netAmt;
    //     existingEntry.grsAmt = grsAmt;
    //     await existingEntry.save();
  
    //     return res.status(200).json({
    //       message: "Cart item updated successfully.",
    //       cart: existingEntry,
    //     });
    //   } else {
    //     // If it doesn't exist, create a new entry
    //     const newEntry = await usercarts.create({
    //       PId,
    //       quantity,
    //       price,
    //       MRP,
    //       PTR,
    //       sch_Per,
    //       cD_Per,
    //       iGST_Per,
    //       cGST_Per,
    //       sGST_Per,
    //       gCESS_Per,
    //       grsAmt,
    //       netAmt,
    //       wPAmt,
    //       schAmt,
    //       cDAmt,
    //       gSTAmt,
    //       gCESSAmt,
    //       taxable,
    //       stockId,
    //       orderFrom: loggedInUserId,
    //       orderTo,
    //     });
  
    //     return res.status(201).json({
    //       message: "Item added to cart successfully.",
    //       cart: newEntry,
    //     });
    //   }
    // } catch (error) {
    //   console.error("Error adding to cart:", error);
    //   return res.status(500).json({ message: "Process failed.", error: error.message });
    // }
    try {
      const data = {...req.user,...req.body}
      const cart = await UsersCartService.addToCart(data);
  
      return res.json(cart);
  
      // return res.status(200).json({ status:message.code200,message: "Distributer updated successfully." });
    } catch (error) {
      console.error("addToCart Error:", error.message);
      return res.status(500).json({ status:message.code500,message: error.message });
    }
};

exports.discardCart= async (req, res) => {
  try {
    const data = {...req.user}
    const cart = await UsersCartService.discardCart(data);
    return res.json(cart);
  } catch (error) {
    console.error("discardCart Error:", error.message);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const data = {...req.user,...req.params}
    const cart = await UsersCartService.deleteCartItem(data);
    return res.json(cart);
  } catch (error) {
    console.error("deleteCartItem Error:", error.message);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
};

exports.getUserCart = async (req, res) => {
    try {
      const data = {...req.user,...req.query}
      const cart = await UsersCartService.getUserCart(data);
      return res.json(cart);
    } catch (error) {
      console.error("deleteCartItem Error:", error.message);
      return res.status(500).json({ status:message.code500,message: error.message });
    }
  
};
  
  

  



