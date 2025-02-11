// controllers/ordersController.js
const OrdersService = require('../services/ordersService');
const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const { verifyToken } = require('../middlewares/auth')

const ordersService = new OrdersService(db);

class OrdersController {
  static async createOrder(req, res) {
    // try {
    //   const { id: loggedInUserId ,userType} = req.user;
    //   console.log(userType);
    //   const orderData = req.body;

    //   if(userType === "Employee"){
    //     const employee =await db.employees.findOne({where:{employeeId:loggedInUserId}});
    //     loggedInUserId = employee.employeeOf;
    //   }
    //   const newOrder = await ordersService.createOrder(orderData, loggedInUserId);
    //   res.status(201).json(newOrder);
    // } catch (error) {
    //   res.status(500).json({ error: error.message });
    // }
    try {
      const data = req.user
      const orderData = req.body
      const order = await ordersService.createOrder(data, orderData);
      return res.json(order);
    } catch (error) {
      console.error("Error in createOrder:", error.message);
      return res.status(500).json({ status: message.code500, message: error.message });
    }
  }

  // static async updateOrder(req, res) {
  //   try {
  //     // const data = req.user
  //     // const orderData = req.body
  //     const data = {...req.user,...req.body}
  //     const order = await ordersService.updateOrder(data);
  //     return res.json(order);
  //   } catch (error) {
  //     console.error("Error in createOrder:", error.message);
  //     return res.status(500).json({ status: message.code500, message: error.message });
  //   }
  // }

  static async updateOrder(req, res) {
    try {
      let { id: loggedInUserId, userType } = req.user;
      const orderId = req.params.id;
      const updates = req.body;
      // console.log(req.user,';;;;;;;;')
      if (userType === "Employee") {
        // const employee = await db.employees.findOne({ where: { employeeId: loggedInUserId } });
        loggedInUserId = req.user.data.employeeOf;
      }
      const updatedOrder = await ordersService.updateOrder(orderId, updates, loggedInUserId);
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getOrdersByFilters(req, res) {
    try {
      const filters = req.query;

      const ordersList = await ordersService.getOrdersByFilters(filters);
      res.status(200).json(ordersList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getOrdersByType(req, res) {
    try {
      const { id: loggedInUserId, userType } = req.user;
      //  const { type: orderType } = req.params;

      const filters = req.query;
      console.log("orderType " + filters.orderType);
      if (userType === "Employee") {
        const employee = await db.employees.findOne({ where: { employeeId: loggedInUserId } });
        loggedInUserId = employee.employeeOf;
      }
      const ordersList = await ordersService.getOrdersByType(filters, filters.orderType, loggedInUserId);
      res.status(200).json(ordersList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = OrdersController;
