// const db = require('../models/users')
const message = require('../helpers/message')
const { generateToken } = require('../middlewares/auth')
const db = require('../models/db')
const users = db.users;
const orders = db.orders;
const authorizations = db.authorizations;
const orderitems = db.orderitems;
const Sequelize = db.sequelize;
const Op = db.Op;
const Pharmacy = db.pharmacies;


exports.createOrder = async (req, res) => {
    console.log(req.body.orderData)
  const loggedInUserId = req.user.id; // User ID from token
  const userType = req.user.userType; // User Type from token
  console.log(userType)
   const  {orderItems } = req.body;
  const {
    orderNo,
    orderDate,
    invNo,
    confirmationDate,
    dueDate,
    barcode,
    invAmt,
    cNAmt,
    recdAmt,
    balance,
    sMan,
    sMobile,
    dMan,
    dMobile,
    orderStatus,
    orderTo,
    deliveredAt,
    divisionId
     // Array of order items
  } = req.body.orderData;

  try {
    // Create the order
    const newOrder = await orders.create({
      orderNo,
      orderDate,
      invNo,
      confirmationDate,
      dueDate,
      barcode,
      invAmt,
      cNAmt,
      recdAmt,
      balance,
      sMan,
      sMobile,
      dMan,
      dMobile,
      orderStatus,
      orderFrom:loggedInUserId, // Set the orderTo field to the logged-in user ID
      orderTo , 
      deliveredAt,
      divisionId
    });

    // Create associated order items
    if (orderItems && orderItems.length > 0) {
      const orderItemsData = orderItems.map((item) => ({
        ...item,
        orderId: newOrder.id, // Associate each item with the new order
      }));

      await orderitems.bulkCreate(orderItemsData);
    }

    return res.status(201).json({
      message: "Order created successfully.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Failed to create order.", error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
    const { id } = req.params; // Order ID from the URL parameter
    const { orderStatus } = req.body; // New order status from the request body
    const loggedInUserId = req.user.id; // Logged-in user ID from the token
  
    // Valid order statuses
    const validStatuses = ["Pending", "Approved", "Rejected", "Shipped", "Delivered", "Canceled"];
  
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status." });
    }
  
    try {
      // Fetch the order by ID
      const order = await orders.findByPk(id);
  
      if (!order) {
        return res.status(404).json({ message: "Order not found." });
      }
  
      // Check if the logged-in user is authorized to update the order
      if (order.orderTo !== loggedInUserId) {
        return res.status(403).json({ message: "You are not authorized to update this order." });
      }
  
      // Fields to update
      const updateFields = { orderStatus };
  
      if (orderStatus === "Approved") {
        updateFields.confirmationDate = new Date(); // Set confirmation date
  
        // Check and insert entry in the authorization table
        const existingAuthorization = await authorizations.findOne({
          where: {
            authorizedBy: loggedInUserId,
            authorizedTo: order.orderFrom, // Person who placed the order
          },
        });
  
        if (!existingAuthorization) {
          await authorizations.create({
            authorizedBy: loggedInUserId,
            authorizedTo: order.orderFrom,
            status: "Approved",
          });
        }
      }
  
      if (orderStatus === "Delivered") {
        updateFields.deliveredAt = new Date(); // Set delivery date
      }
  
      // Update the order
      await orders.update(updateFields, { where: { id } });
  
      return res.status(200).json({
        message: "Order updated successfully.",
        updatedOrder: await orders.findByPk(id), // Return the updated order details
      });
    } catch (error) {
      console.error("Error updating order:", error);
      return res.status(500).json({ message: "Failed to update order.", error: error.message });
    }
};


exports.getOrderByFilters = async (req, res) => {
  const { startDate, endDate, orderTo, orderFrom } = req.query;

  try {
    // Calculate the default date range (last 7 days) if no dates are provided
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const filters = {};

    if (startDate && endDate) {
      filters.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else {
      // Default to last 7 days
      filters.createdAt = {
        [Op.between]: [sevenDaysAgo, today],
      };
    }

    if (orderTo) {
      filters.orderTo = orderTo;
    }

    if (orderFrom) {
      filters.orderFrom = orderFrom;
    }

    // Fetch orders based on filters
    const ordersList = await orders.findAll({
      where: filters,
      include: [
        {
          model: users,
          as: "orderToUser",
          attributes: ["id", "username"], // Adjust fields as needed
        },
        {
          model: users,
          as: "orderFromUser",
          attributes: ["id", "username"], // Adjust fields as needed
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Add tagging logic
    const taggedOrders = ordersList.map((order) => {
      const tag = orderTo ? "Sales Orders" : orderFrom ? "Purchase Orders" : null;
      return { ...order.toJSON(), tag };
    });

    return res.status(200).json({
      message: "Orders fetched successfully.",
      orders: taggedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
  }
};


exports.getOrderByType = async (req, res) => {
  const { startDate, endDate, orderType } = req.query;
  const loggedInUserId = req.user.id; // Logged-in user ID

  try {
    // Calculate the default date range (last 7 days) if no dates are provided
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const filters = {};

    if (startDate && endDate) {
      filters.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else {
      // Default to last 7 days
      filters.createdAt = {
        [Op.between]: [sevenDaysAgo, today],
      };
    }

    // Set filters based on `orderType` and logged-in user ID
    if (orderType === "sales") {
      filters.orderTo = loggedInUserId;
    } else if (orderType === "purchase") {
      filters.orderFrom = loggedInUserId;
    } else {
      return res.status(400).json({
        message: "Invalid orderType. Please provide 'sales' or 'purchase'.",
      });
    }

    // Fetch orders based on filters
    const ordersList = await orders.findAll({
      where: filters,
      include: [
        {
          model: users,
          as: "orderToUser",
          attributes: ["id", "username"], // Adjust fields as needed
        },
        {
          model: users,
          as: "orderFromUser",
          attributes: ["id", "username"], // Adjust fields as needed
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Add tagging logic
    const taggedOrders = ordersList.map((order) => {
      const tag = orderType === "sales" ? "Sales Orders" : "Purchase Orders";
      return { ...order.toJSON(), tag };
    });

    return res.status(200).json({
      message: "Orders fetched successfully.",
      orders: taggedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
  }
};


  

  







