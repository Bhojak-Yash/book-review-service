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
      return res.status(order?.status || 200).json(order);
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
      return res.status(updatedOrder?.status || 200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getOrdersByFilters(req, res) {
    try {
      const filters = req.query;

      const ordersList = await ordersService.getOrdersByFilters(filters);
      return res.status(ordersList?.status || 200).json(ordersList);
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
      return res.status(ordersList?.status || 200).json(ordersList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async distributer_purchase_orders(req,res) {
    try {
      const data ={...req.user,...req.query }
      const ordersList = await ordersService.distributer_purchase_orders(data);
      return res.status(ordersList?.status || 200).json(ordersList);
    } catch (error) {
      console.log('distributer_purchase_orders error:',error.message)
      res.json({
        status:message.code500,
        message:error.message
      })
    }
  }

  static async distributer_sales_orders(req,res) {
    try {
      const data ={...req.user,...req.query }
      const ordersList = await ordersService.distributer_sales_orders(data);
      return res.status(ordersList?.status || 200).json(ordersList);
    } catch (error) {
      console.log('distributer_sales_orders error:',error.message)
      res.json({
        status:message.code500,
        message:error.message
      })
    }
  }

  static async distributer_so_card_data(req,res) {
    try {
      const data ={...req.user,...req.query }
      const ordersList = await ordersService.distributer_so_card_data(data);
      return res.status(ordersList?.status || 200).json(ordersList);
    } catch (error) {
      console.log('distributer_sales_orders error:',error.message)
      res.json({
        status:message.code500,
        message:error.message
      })
    }
  }


  static async purchase_order_summary(req,res) {
    try {
      const data ={...req.user,...req.query }
      const ordersList = await ordersService.purchase_order_summary(data);
      return res.status(ordersList?.status || 200).json(ordersList);
    } catch (error) {
      console.log('purchase_order_summary error:',error.message)
      res.json({
        status:message.code500,
        message:error.message
      })
    }
  }

  static async confirm_payment(req,res) {
    try {
      const data ={...req.user,...req.query }
      const ordersList = await ordersService.confirm_payment(data);
      return res.status(ordersList?.status || 200).json(ordersList);
    } catch (error) {
      console.log('confirm_payment error:',error.message)
      res.json({
        status:message.code500,
        message:error.message
      })
    }
  }

  static async getAddressDetails(req, res){
    try{
      const userIdFromToken = req.user?.id;
      const getAddress = await ordersService.getAddressDetails(userIdFromToken);
      return res.status(getAddress?.status || 200).json(getAddress);
    }catch(error){
      console.log("Error in getAddressDetails Controller", error.message);
      res.json({
        status: message.code500,
        message:error.message
      })
    }
  }

  static async updateAddressDetails(req, res) {
    try {
      const userIdFromToken = req.user?.id;
      const addressPayload = req.body; // assuming address fields are passed in the body

      const result = await ordersService.updateAddressDetails(userIdFromToken, addressPayload);

      return res.status(result?.status || 200).json(result);
    } catch (error) {
      console.log("Error in updateAddressDetails Controller", error.message);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async calculate_order(req, res) {
    try {
      

      return res.status(result?.status || 200).json(result);
    } catch (error) {
      console.log("Error in updateAddressDetails Controller", error.message);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // static async calculate_price(req, res) {
  //   try {
  //     const data = {
  //       ...req.user,
  //       ...req.body // This includes orderId, orderItems, and orderData
  //     };

  //     // console.log("data", data.orderItems);
  //     const ordersList = await ordersService.calculate_price(data.orderItems, data.orderData);

  //     return res.status(ordersList?.status || 200).json(ordersList);
  //   } catch (error) {
  //     console.error('calculate_price Controller error:', error.message);
  //     res.status(500).json({
  //       status: message.code500,
  //       message: 'Internal Server Error'
  //     });
  //   }
  // }


}

module.exports = OrdersController;
