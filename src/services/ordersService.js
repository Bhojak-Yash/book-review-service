const { where } = require('sequelize');
const message = require('../helpers/message');
const db = require('../models/db');
const StocksService = require('./stocksService');
const notificationsService = require('../services/notificationsService');

const Op = db.Op;
const moment = require("moment");

class OrdersService {
  constructor(db) {
    this.db = db;
  }

  async createOrder(data, orderData) {
    // const { orderItems, ...orderDetails } = orderData;

    // const newOrder = await this.db.orders.create({
    //   ...orderDetails,
    //   orderFrom: loggedInUserId,
    // });

    // if (orderItems && orderItems.length > 0) {
    //   const orderItemsData = orderItems.map((item) => ({
    //     ...item,
    //     orderId: newOrder.id,
    //   }));
    //   await this.db.orderitems.bulkCreate(orderItemsData);
    // }

    // return newOrder;
    let transaction;
    try {
      let orderby;
      if (data.userType === 'Employee') {
        orderby = data.data.employeeOf
      } else {
        orderby = data.id
      }
      transaction = await db.sequelize.transaction();

      const newOrder = await db.orders.create({
        ...orderData.orderData,
        orderFrom: Number(orderby)
      }, { transaction })
      if (orderData.orderItems && orderData.orderItems.length > 0) {
        const orderItemsData = orderData?.orderItems.map((item) => ({
          ...item,
          orderId: newOrder.id,
        }));
        await db.orderitems.bulkCreate(orderItemsData, { transaction });
      }
      const deletedItemsCount = await db.usercarts.destroy({
        where: {
          orderFrom: Number(data.id),
          orderTo: Number(orderData.orderData.orderTo)
        },
      }, { transaction })


      // Calling the notificationService.............................................................................
      await notificationsService.createNotification({
        organisationId: orderData.orderData.orderTo,
        category: "PO Received",
        title: "New Purchase Order Received",
        description: `You have received a new purchase order.`
      }, transaction);



      await transaction.commit();
      return {
        status: message.code200,
        message: message.message200,
        apiData: newOrder
      }
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.log('createOrder service error:', error.message)
      return {
        status: message.code500,
        message: message.message500
      }
    }
  }

  async updateOrder(orderId, updates, loggedInUserId) {
    // console.log(orderId, updates, loggedInUserId, ';;lllll')
    try {
      const order = await this.db.orders.findByPk(orderId);
      // console.log(order?.dataValues)
      const orderToDeatils = await db.users.findOne({ where: { id: order?.dataValues?.orderTo } })
      const orderItems = await db.orderitems.findAll({
        where: { orderId: orderId },
      });
      // console.log('pppppppppppppppppp')

      const tableName = orderToDeatils?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
      const tableNameRow = orderToDeatils?.userType === 'Manufacturer' ? 'manufacturer_stocks' : "stocks";
      // console.log(order,orderItems,';pppppp')
      if (!orderItems) {
        throw new Error("Order items not found.");
      }
      if (updates?.payment) {
        const { amount, mode, image } = updates?.payment
        await db.payments.create({
          orderId: Number(orderId),
          amount: Number(amount),
          mode: mode,
          image: image,
          status: 'Pending'
        })

        const data = await db.orders.findOne({ where: { id: Number(orderId) } })
        const aaa=  Number(Number(data.dataValues.balance).toFixed(2))

        if (Number(aaa) <= 0) {
          throw new Error("Payment already completed for this order.");
        }

        let oStatus = 'Paid'
        if (Number(aaa) > Number(amount)) {
          console.log('[[[[[[[[[[')
          oStatus = 'Partially paid'
        }
        if(data?.dataValues?.orderStatus==='Confirmed' || data?.dataValues?.orderStatus==='Pending' || data?.dataValues?.orderStatus==='Dispatched'){
          oStatus = data?.dataValues?.orderStatus
        }
        let amtUpdate = amount;
        if (Number(aaa) <= Number(amount)) {
          amtUpdate = Number(data.dataValues.balance)
        }
        if(aaa-Number(amtUpdate)==0){
          oStatus='Paid'
        }
        console.log(oStatus,'llllllllllllll',aaa,amtUpdate)
        await db.orders.update({ balance: db.sequelize.literal(`balance - ${Number(amtUpdate)}`), orderStatus: oStatus }, { where: { id: Number(orderId) } })
        return {
          status: message.code200,
          message: message.message200
        }
      }

      if (updates.orderStatus === "Confirmed" || updates.orderStatus === 'Rejected' || updates.orderStatus === 'Ready to ship' || updates.orderStatus === 'Ready to pickup' || updates.orderStatus === 'Dispatched') {
        if (order.orderTo != loggedInUserId) {
          throw new Error("Unauthorized to update this order.");
        }
      } else {
        if (order.orderFrom != loggedInUserId) {
          throw new Error("Unauthorized to update this order.");
        }
      }

      if (updates.orderStatus === "Confirmed") {
        //  console.log(';;;;;;;;;;;;;;;;;;')
        updates.confirmationDate = new Date();
        if (orderItems && orderItems.length > 0) {

          await db.sequelize.transaction(async (t) => {
            // First, check if all items have enough stock before making any updates
            for (const item of updates.items) {
              console.log('pppppppp')
              const [stock] = await db.sequelize.query(
                `SELECT Stock FROM ${tableNameRow} WHERE SId = :stockId`,
                {
                  replacements: { stockId: item.stockId },
                  type: db.Sequelize.QueryTypes.SELECT,
                  transaction: t, // Use the transaction
                }
              );
              // console.log('ppppp',updates)
              if (!stock || stock.Stock < item.quantity) {
                throw new Error(
                  `Insufficient stock for item ID ${item.stockId}. Ensure sufficient stock is available.`
                );
              }
            }
            console.log(updates?.items);

            for (let item of updates?.items) {
              console.log('dwekjh')
              await db.orderitems.update(item, { where: { id: item.id } }, { transaction: t });
            }

            // If all items have sufficient stock, update them
            await Promise.all(
              updates?.items?.map(async (item) => {
                // console.log(item?.stockId)
                await db.sequelize.query(
                  `UPDATE ${tableNameRow} SET Stock = Stock - :itemQuantity WHERE SId = :stockId`,
                  {
                    replacements: {
                      itemQuantity: item.quantity,
                      stockId: item.stockId,
                    },
                    transaction: t,
                  }
                );
                // await db.orderitems.update(item)
              })
            );
          });
        }
        // console.log("testttttt");
        // Sending notification for PO Received
        await notificationsService.createNotification({
          organisationId: order.orderFrom,
          category: "PO Status update",
          title: "Purchase Order: Confirmed",
          description: `Your purchase order has been confirmed for orderId ${orderId}.`
        });
      }
      // if(updates.orderStatus === "Rejected"){

      // }

      if (updates.orderStatus === 'Dispatched') {
        // if (orderItems && orderItems.length > 0) {

        await db.sequelize.transaction(async (t) => {
          // First, check if all items have enough stock before making any updates
          // for (const item of updates.items) {
          // const [stock] = await db.sequelize.query(
          //   `SELECT * FROM stocks WHERE SId = :stockId`,
          //   {
          //     replacements: { stockId: item.stockId },
          //     type: db.Sequelize.QueryTypes.SELECT,
          //     transaction: t, // Use the transaction
          //   }
          // );
          await db.sequelize.transaction(async (t) => {
            // First, check if all items have enough stock before making any updates
            for (const item of updates.items) {
              // console.log(item,';;;;;;')
              db.orderitems.update({
                BoxQty: item?.BoxQty || 0,
                loose: item?.loose || 0
              }, { where: { id: Number(item.id) } }), { transaction: t }
            }

            // If all items have sufficient stock, update them
            // await Promise.all(
            //   orderItems.map(async (item) => {

            //   })
            // );          
          });
          // }

          // If all items have sufficient stock, update them
          // await Promise.all(
          //   orderItems.map(async (item) => {

          //   })
          // );          
        });
        // }
      }

      if (updates.orderStatus === "Inward" || updates.orderStatus === "Paid" || updates.orderStatus === "Partially paid") {
        updates.deliveredAt = new Date();
        // Retrieve the items in the order
        // const orderItems = await db.orderitems.findAll({
        //   where: { orderId: orderId },
        // });

        if (orderItems && orderItems.length > 0) {

          await db.sequelize.transaction(async (t) => {
            // First, check if all items have enough stock before making any updates
            for (const item of orderItems) {
              const [stock] = await db.sequelize.query(
                `SELECT * FROM stocks WHERE SId = :stockId`,
                {
                  replacements: { stockId: item.stockId },
                  type: db.Sequelize.QueryTypes.SELECT,
                  transaction: t, // Use the transaction
                }
              );
              await db.sequelize.query(
                `INSERT INTO stocks (PId, BatchNo,ExpDate, Stock,createdAt,updatedAt,organisationId,MRP,PTR,Scheme,BoxQty,loose,purchasedFrom) 
               VALUES (:PId, :BatchNo,:ExpDate ,:itemQuantity,:createdAt,:updatedAt,:organisationId,:MRP,:PTR,:Scheme,:BoxQty,:loose,:purchasedFrom) 
               ON DUPLICATE KEY UPDATE Stock = Stock + :itemQuantity`,
                {
                  replacements: {
                    itemQuantity: item.quantity,
                    PId: item.PId,
                    BatchNo: stock.BatchNo,
                    ExpDate: stock.ExpDate,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    organisationId: order.orderFrom,
                    MRP: item.MRP,
                    PTR: item.PTR,
                    Scheme: item.Scheme,
                    BoxQty: item.BoxQty,
                    loose: item.loose,
                    purchasedFrom: order?.dataValues?.orderTo
                  },
                  transaction: t, // Use the transaction
                }
              );

            }

            // If all items have sufficient stock, update them
            // await Promise.all(
            //   orderItems.map(async (item) => {

            //   })
            // );          
          });
        }
      }


      if (updates?.orderStatus === "Inward") {
        // console.log('inwarddddddddd')
        if(order?.dataValues?.balance ==0){
          let sss = updates
          sss.orderStatus = 'Paid'
          await this.db.orders.update(sss, { where: { id: orderId } })
        }else if (order?.dataValues?.balance < order?.dataValues?.invAmt) {
          // console.log('bda haiiiiiiiiii')
          let sss = updates
          sss.orderStatus = 'Partially paid'
          console.log(sss)
          await this.db.orders.update(sss, { where: { id: orderId } });
        }else{
         await this.db.orders.update(updates, { where: { id: orderId } });
        }
      } else {
        await this.db.orders.update(updates, { where: { id: orderId } });
      }
      // const aaa=await this.db.orders.findByPk(orderId);
      // console.log(aaa)
      return await this.db.orders.findByPk(orderId);
    } catch (error) {
      console.log('update order servcie error:', error.message)
      return {
        status: message.code500,
        message: error.message
      }
    }
  }

  // async updateOrder(data) {
  //   try {
  //     const orderData = await db.orders.findOne({where:{id:Number(data.orderId)}})
  //     return {
  //       status:message.code200,
  //       message:message.message200,
  //       apiData:orderData
  //     }
  //   } catch (error) {
  //     console.log('updateOrder service error:',error.message)
  //     return {
  //       status:message.code500,
  //       message:error.message
  //     }
  //   }
  // }

  async getOrdersByFilters(filters) {
    console.log(filters);
    const whereClause = {
      orderDate: {
        [this.db.Sequelize.Op.between]: [filters.startDate, filters.endDate],
      },
    };

    if (filters.orderTo) {
      whereClause.orderTo = filters.orderTo;
    } else if (filters.orderFrom) {
      whereClause.orderFrom = filters.orderFrom;
    }

    const ordersList = await this.db.orders.findAll({
      where: whereClause,
      include: [
        {
          model: this.db.users,
          as: "orderToUser",
          attributes: ["id", "username"],
        },
        {
          model: this.db.users,
          as: "orderFromUser",
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return ordersList.map((order) => {
      const tag = filters.orderTo ? "Sales Orders" : filters.orderFrom ? "Purchase Orders" : null;
      return { ...order.toJSON(), tag };
    });
  }

  async getOrdersByType(filters, orderType, loggedInUserId) {

    if (orderType === "sales") {
      filters.orderTo = loggedInUserId;
    } else if (orderType === "purchase") {
      filters.orderFrom = loggedInUserId;
    } else {
      throw new Error("Invalid order type.");
    }

    return this.getOrdersByFilters(filters);
  }

  async distributer_purchase_orders(data) {
    try {
      const id = Number(data.id);
      const Page = Number(data.page) || 1;
      const Limit = Number(data.limit) || 10;
      let skip = 0;
      let whereClause = { orderFrom: id };
      console.log(id)
      if (Page > 1) {
        skip = (Page - 1) * Limit;
      }

      // Adjust search condition
      if (data.search) {
        whereClause[Op.or] = [
          { id: { [Op.like]: `%${data.search}%` } }, // Search by order ID
          {
            '$manufacturer.companyName$': { [Op.like]: `%${data.search}%` } // Search by manufacturer name
          },
          {
            '$distributor.companyName$': { [Op.like]: `%${data.search}%` } // Search by manufacturer name
          }
        ];
      }
      if (data.start_date && data.end_date) {
        const startDate = moment(data.start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(data.end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");

        whereClause.orderDate = {
          [Op.between]: [startDate, endDate]
        };
      }
      // console.log(whereClause)
      const { count, rows: orders } = await db.orders.findAndCountAll({
        attributes: [
          "id",
          "orderDate",
          "dueDate",
          "deliveredAt",
          "invAmt",
          "orderStatus",
          "orderTo",
          "orderFrom",
          "orderTotal",
          "invNo",
          "balance",
          "deliveryType",
          "reason"
        ],
        include: [
          {
            model: db.manufacturers,
            as: "manufacturer",
            attributes: ["companyName"],
            required: false, // Ensure manufacturer is included even if no match is found
          },
          {
            model: db.distributors,
            as: "distributor",
            attributes: ["companyName"],
            required: false, // Ensure manufacturer is included even if no match is found
          },
          {
            model: db.authorizations,
            where: { authorizedId: Number(id) },
            as: "auth",
            attributes: ['creditCycle'],
            required: false
          }
        ],
        where: whereClause,
        offset: skip,
        limit: Limit,
        order: [["orderDate", "DESC"]]
      });
      // "ENUM('Pending', 'Confirmed', 'Rejected', 'Ready to ship', 'Ready to pickup', 'Dispatched', 'Received', 'Paid', 'Partially paid', 'Canceled')"
      const updatesResult = orders?.map((order) => {
        let overdue = false;

        if (order.deliveredAt && order.auth?.creditCycle) {
          const deliveredDate = new Date(order.deliveredAt);

          deliveredDate.setDate(deliveredDate.getDate() + order.auth.creditCycle);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          overdue = deliveredDate < today;
        }

        return {
          "id": order.id,
          "orderDate": order.orderDate,
          "dueDate": order.dueDate,
          "deliveredAt": order.deliveredAt,
          "invAmt": order.invAmt,
          "status": order.orderStatus,
          "orderTotal": order.orderTotal,
          "invNo": order.invNo,
          "balance": order.balance,
          "orderTo": order.manufacturer?.companyName || order?.distributor.companyName || order?.order,
          "deliveryType": order.deliveryType,
          // "auth": order.auth,
          "overdue": overdue,
          "reason":order?.reason || ''
        };
      });


      return {
        status: message.code200,
        message: message.message200,
        totalItems: count,
        currentPage: Page,
        totalPage: Math.ceil(count / Limit),
        apiData: updatesResult,
      };
    } catch (error) {
      console.log("distributer_purchase_orders service error:", error.message);
      return {
        status: message.code500,
        message: error.message,
      };
    }
  }

  async distributer_sales_orders(data) {
    try {
      const id = Number(data.id);
      const Page = Number(data.page) || 1;
      const Limit = Number(data.limit) || 10;
      let skip = (Page - 1) * Limit;
      let whereClause = { orderTo: id };

      // Date Filter
      if (data.start_date && data.end_date) {
        const startDate = moment(data.start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(data.end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");
        whereClause.orderDate = { [Op.between]: [startDate, endDate] };
      }

      // Status Filter
      if (data.status) {
        if (data.status === 'Unpaid') {
          whereClause.balance = { [Op.gt]: 0 };
        } else {
          whereClause.orderStatus = data.status;
        }
      }

      // Search Filter
      if (data.search) {
        whereClause[Op.or] = [
          { id: { [Op.like]: `%${data.search}%` } }, // Search by orderId
        ];
      }
// console.log(whereClause,'oppppppp')
      const { count, rows: orders } = await db.orders.findAndCountAll({
        attributes: [
          "id", "orderDate", "dueDate", "deliveredAt", "invAmt",
          "orderStatus", "orderTo", "orderFrom", "orderTotal", "invNo", "balance", "reason"
        ],
        include: [
          {
            model: db.users,
            as: "orderFromUser",
            attributes: ["id", "userType"],
            required: false,
            include: [
              {
                model: db.retailers,
                as: "reuser",
                attributes: ["retailerId", "firmName"],
                required: false
              },
              {
                model: db.distributors,
                as: "disuser",
                attributes: ["distributorId", "companyName"],
                required: false
              },
            ],
          },
        ],
        where: whereClause,
        offset: skip,
        limit: Limit,
        order: [["id", "DESC"]]
      });

      // Formatting Result
      const result = orders.map((order) => {
        let orderFrom = "";
        let userType = "";

        if (order?.orderFromUser?.reuser?.length > 0) {
          orderFrom = order?.orderFromUser.reuser[0].firmName;
          userType = "Retailer";
        } else if (order?.orderFromUser?.disuser?.length > 0) {
          orderFrom = order?.orderFromUser.disuser[0].companyName;
          userType = "Distributor";
        }

        return {
          id: order.id,
          orderDate: order.orderDate,
          dueDate: order.dueDate,
          deliveredAt: order.deliveredAt,
          invAmt: order.invAmt,
          balance: order.balance || 0,
          status: order.orderStatus,
          orderFrom: orderFrom,
          userType: userType,
          orderTotal: order.orderTotal,
          invNo: order.invNo,
          reason: order.reason || null,
        };
      });

      return {
        status: message.code200,
        message: message.message200,
        totalItems: count,
        currentPage: Page,
        totalPage: Math.ceil(count / Limit),
        apiData: result,
      };
    } catch (error) {
      console.log("distributer_sales_orders error:", error.message);
      return {
        status: message.code500,
        message: error.message,
      };
    }
  }

  // async purchase_order_summary(data) {
  //   try {
  //     const { id, orderId } = data
  //     const userId = Number(id)
  //     if (!id || !userId) {
  //       return {
  //         status: message.code400,
  //         message: 'orderId is required'
  //       }
  //     }
  //     // const user = await db.users.findOne({
  //     //   where: { id: Number(userId) },
  //     //   attributes: ['id'],
  //     //   include: [
  //     //     {
  //     //       model: db.manufacturers,
  //     //       as: "manufacturer",
  //     //       attributes: ["manufacturerId", "companyName"],
  //     //       required: false,
  //     //     },
  //     //     {
  //     //       model: db.distributors,
  //     //       as: "disuser",
  //     //       attributes: ["distributorId", "companyName"],
  //     //       required: false,
  //     //     },
  //     //     {
  //     //       model: db.address,
  //     //       as: "address",
  //     //       required: false,
  //     //     }
  //     //   ]
  //     // })

  //     // const updatedUser = {
  //     //   "id":user?.id,
  //     //   "companyName":user?.manufacturer[0]?user?.manufacturer[0].companyName:user?.disuser[0].companyName,
  //     //   "address":user?.address[0]?.addressType==='Billing'?user?.address[0]:user?.address[1]
  //     // }

  //     const aaa = await db.orders.findOne({ where: { id: Number(orderId) } })
  //     const checkUser = await db.users.findOne({ where: { id: Number(aaa?.dataValues?.orderTo) } })
  //     const tableName = checkUser?.dataValues?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
  //     const as = checkUser?.dataValues?.userType == 'Manufacturer' ? 'stocks' : 'stock';
  //     console.log(as,tableName,';;;;;;;;',checkUser?.dataValues?.userType)
  //     const order = await db.orders.findOne({
  //       // attributes:[''],
  //       where: { id: Number(orderId) },
  //       include: [
  //         {
  //           model: db.orderitems,
  //           as: "orderItems",
  //           include: [
  //             {
  //               model: db.products,
  //               as: "product",
  //               attributes: ['PId', 'PName', 'SaltComposition','PackagingDetails']
  //             },
  //             {
  //               model: tableName,
  //               as: as,
  //               attributes: ['SId', 'BatchNo', 'stock', 'PTS']
  //             }
  //           ]
  //         },
  //         {
  //           model: db.payments,
  //           as: 'payments',
  //         }
  //       ]
  //     })

  //     order.balance = parseFloat(order.balance).toFixed(2);

  //     const Op = db.Op

  //     const users = await db.users.findAll({
  //       where: { id: { [Op.or]: [Number(order.orderTo), Number(order.orderFrom)] } },
  //       attributes: ["id"],
  //       include: [
  //         {
  //           model: db.distributors,
  //           as: "disuser",
  //           attributes: ["distributorId", "companyName", "PAN", "GST"],
  //           required: false,
  //         },
  //         {
  //           model: db.retailers,
  //           as: "reuser",
  //           attributes: ["retailerId", "firmName", "PAN", "GST"],
  //           required: false,
  //         },
  //         {
  //           model: db.address,
  //           as: "address",
  //           required: false,
  //         },
  //       ],
  //     });

  //     // Extract users based on their IDs
  //     const userTo = users.find(user => user.id === Number(order.orderTo)) || null;
  //     const userFrom = users.find(user => user.id === Number(order.orderFrom)) || null;

  //     // Format the response for both users
  //     const formatUser = (user) => ({
  //       id: user?.id || null,
  //       companyName: user?.reuser?.[0]?.firmName || user?.disuser?.[0]?.companyName || null,
  //       PAN: user?.reuser?.[0]?.PAN || user?.disuser?.[0]?.PAN || null,
  //       GST: user?.reuser?.[0]?.GST || user?.disuser?.[0]?.GST || null,
  //       address: user?.address || null,
  //     });

  //     const formattedOrder = {
  //         "id": order?.id,
  //         "orderDate": order?.orderDate,
  //         "invNo": order?.invNo,
  //         "confirmationDate": order?.confirmationDate,
  //         "dueDate": order?.dueDate,
  //         "barcode": order?.barcode,
  //         "invAmt": order?.invAmt,
  //         "cNAmt": order?.cNAmt,
  //         "recdAmt": order?.recdAmt,
  //         "balance": order?.balance,
  //         "sMan": order?.sMan,
  //         "sMobile": order?.sMobile,
  //         "dMan": order?.dMan,
  //         "dMobile": order?.dMo,
  //         "orderStatus": order?.orderStatus,
  //         "orderFrom": order?.orderFrom,
  //         "orderTo": order?.orderTo,
  //         "orderTotal": order?.orderTotal,
  //         "deliveredAt": order?.deliveredAt,
  //         "entityId": order?.entityId,
  //         "reason": order?.reason,
  //         "invUrl": order?.invUrl,
  //         "deliveryType": order?.deliveryType,
  //         "dispatchDate": order?.dispatchDate,
  //         "createdAt": order?.createdAt,
  //         "updatedAt": order?.updatedAt,
  //         "orderItems": order?.orderItems?.map((item)=>{
  //           return {
  //             "id": item?.id,
  //             "invNo": item?.invNo,
  //             "PId": item?.PId,
  //             "quantity": item?.quantity,
  //             "schQty": item?.schQty,
  //             "price": item?.price,
  //             "MRP": item?.MRP,
  //             "PTR": item?.PTR,
  //             "sch_Per": item?.sch_Per,
  //             "cD_Per": item?.cD_Per,
  //             "iGST_Per": item?.iGST_Per,
  //             "cGST_Per": item?.cGST_Per,
  //             "sGST_Per": item?.sGST_Per,
  //             "gCESS_Per": item?.gCESS_Per,
  //             "grsAmt": item?.grsAmt,
  //             "netAmt": item?.netAmt,
  //             "wPAmt": item?.wPAmt,
  //             "schAmt": item?.schAmt,
  //             "cDAmt": item?.cDAmt,
  //             "gSTAmt": item?.gSTAmt,
  //             "gCESSAmt": item?.gCESSAmt,
  //             "taxable": item?.taxable,
  //             "createdAt": item?.createdAt,
  //             "updatedAt": item?.updatedAt,
  //             "deletedAt": item?.deletedAt,
  //             "orderId": item?.orderId,
  //             "stockId": item?.stockId,
  //             "BoxQty": item?.BoxQty,
  //             "Scheme": item?.Scheme,
  //             "loose": item?.loose,
  //             "PTS": item?.PTS,
  //             "product": item?.product,
  //             "stock": item?.stocks || item?.stock || {}
  //         }
  //         }),
  //         "payments": order?.payments

  //     }

  //     return {
  //       status: message.code200,
  //       message: "Order fetched successfully.",
  //       distributor: formatUser(userFrom), // Distributor details (orderFrom)
  //       manufacturer: formatUser(userTo),  // Manufacturer details (orderTo)
  //       order: formattedOrder,
  //     };
  //     ;
  //   } catch (error) {
  //     console.log('purchase_order_summary service error:', error.message)
  //     return {
  //       status: message.code500,
  //       message: message.message500,
  //       // apiData: null
  //     }
  //   }
  // }

  async purchase_order_summary(data) {
    try {
      const { id, orderId } = data
      const userId = Number(id)
      if (!id || !userId) {
        return {
          status: message.code400,
          message: 'orderId is required'
        }
      }

      const aaa = await db.orders.findOne({ where: { id: Number(orderId) } })
      const checkUser = await db.users.findOne({ where: { id: Number(aaa?.dataValues?.orderTo) } })
      const tableName = checkUser?.dataValues?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
      const as = checkUser?.dataValues?.userType == 'Manufacturer' ? 'stocks' : 'stock';
      console.log(as, tableName, ';;;;;;;;', checkUser?.dataValues?.userType)
      const order = await db.orders.findOne({
        // attributes:[''],
        where: { id: Number(orderId) },
        include: [
          {
            model: db.orderitems,
            as: "orderItems",
            include: [
              {
                model: db.products,
                as: "product",
                attributes: ['PId', 'PName', 'SaltComposition','PackagingDetails']
              },
              {
                model: tableName,
                as: as,
                attributes: ['SId', 'BatchNo', 'stock', 'PTS']
              }
            ]
          },
          {
            model: db.payments,
            as: 'payments',
          }
        ]
      })

      order.balance = parseFloat(order.balance).toFixed(2);

      const Op = db.Op

      const users = await db.users.findAll({
        where: { id: { [Op.or]: [Number(order.orderTo), Number(order.orderFrom)] } },
        attributes: ["id"],
        include: [
          {
            model: db.distributors,
            as: "disuser",
            attributes: ["distributorId", "companyName", "PAN", "GST"],
            required: false,
          },
          {
            model: db.retailers,
            as: "reuser",
            attributes: ["retailerId", "firmName", "PAN", "GST"],
            required: false,
          },
          {
            model: db.manufacturers,
            as: "manufacturer",
            attributes: ["manufacturerId", "companyName", "PAN", "GST"],
            required: false,
          },
          {
            model: db.address,
            as: "address",
            required: false,
          },
        ],
      });

      // Extract users based on their IDs
      const userTo = users.find(user => user.id === Number(order.orderTo)) || null;
      const userFrom = users.find(user => user.id === Number(order.orderFrom)) || null;
// console.log(userTo.dataValues.manufacturer,'[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[')
      // Format the response for both users
      const formatUser = (user) => ({
        id: user?.id || null,
        companyName: user?.reuser?.[0]?.firmName || user?.disuser?.[0]?.companyName || user?.manufacturer?.[0]?.companyName || null,
        PAN: user?.reuser?.[0]?.PAN || user?.disuser?.[0]?.PAN || user?.manufacturer?.[0]?.PAN || null,
        GST: user?.reuser?.[0]?.GST || user?.disuser?.[0]?.GST || user?.manufacturer?.[0]?.GST || null,
        address: user?.address || null,
      });

      const formattedOrder = {
          "id": order?.id,
          "orderDate": order?.orderDate,
          "invNo": order?.invNo,
          "confirmationDate": order?.confirmationDate,
          "dueDate": order?.dueDate,
          "barcode": order?.barcode,
          "invAmt": order?.invAmt,
          "cNAmt": order?.cNAmt,
          "recdAmt": order?.recdAmt,
          "balance": order?.balance,
          "sMan": order?.sMan,
          "sMobile": order?.sMobile,
          "dMan": order?.dMan,
          "dMobile": order?.dMo,
          "orderStatus": order?.orderStatus,
          "orderFrom": order?.orderFrom,
          "orderTo": order?.orderTo,
          "orderTotal": order?.orderTotal,
          "deliveredAt": order?.deliveredAt,
          "entityId": order?.entityId,
          "reason": order?.reason,
          "invUrl": order?.invUrl,
          "deliveryType": order?.deliveryType,
          "dispatchDate": order?.dispatchDate,
          "createdAt": order?.createdAt,
          "updatedAt": order?.updatedAt,
          "orderItems": order?.orderItems?.map((item)=>{
            return {
              "id": item?.id,
              "invNo": item?.invNo,
              "PId": item?.PId,
              "quantity": item?.quantity,
              "schQty": item?.schQty,
              "price": item?.price,
              "MRP": item?.MRP,
              "PTR": item?.PTR,
              "sch_Per": item?.sch_Per,
              "cD_Per": item?.cD_Per,
              "iGST_Per": item?.iGST_Per,
              "cGST_Per": item?.cGST_Per,
              "sGST_Per": item?.sGST_Per,
              "gCESS_Per": item?.gCESS_Per,
              "grsAmt": item?.grsAmt,
              "netAmt": item?.netAmt,
              "wPAmt": item?.wPAmt,
              "schAmt": item?.schAmt,
              "cDAmt": item?.cDAmt,
              "gSTAmt": item?.gSTAmt,
              "gCESSAmt": item?.gCESSAmt,
              "taxable": item?.taxable,
              "createdAt": item?.createdAt,
              "updatedAt": item?.updatedAt,
              "deletedAt": item?.deletedAt,
              "orderId": item?.orderId,
              "stockId": item?.stockId,
              "BoxQty": item?.BoxQty,
              "Scheme": item?.Scheme,
              "loose": item?.loose,
              "PTS": item?.PTS,
              "product": item?.product,
              "stock": item?.stocks || item?.stock || {}
          }
        }),
        "payments": order?.payments
      }

      // Determine tax type based on state
      const getStateFromAddress = (user) => {
        const billingAddress = user?.address?.find(addr => addr.addressType === 'Billing');
        return billingAddress?.State || null;  
      };


      const fromState = getStateFromAddress(userFrom);
      const toState = getStateFromAddress(userTo);

      let taxType = null;
      if (fromState && toState) {
        taxType = (fromState === toState) ? 'SGST_CGST' : 'IGST';
      }

      return {
        status: message.code200,
        message: "Order fetched successfully.",
        distributor: formatUser(userFrom), // Distributor details (orderFrom)
        manufacturer: formatUser(userTo),  // Manufacturer details (orderTo)
        order: formattedOrder,
        taxType: taxType || 'Unknown'
      };
    } catch (error) {
      console.log('purchase_order_summary service error:', error.message)
      return {
        status: message.code500,
        message: message.message500,
        // apiData: null
      }
    }
  }

  async confirm_payment(data) {
    try {
      const { id, paymentId } = data
      await db.payments.update(
        { status: 'Confirmed' },
        { where: { id: Number(paymentId) } }
      );
      return {
        status: message.code200,
        message: message.code200
      }
    } catch (error) {
      console.log('confirm_payment service error:', error.message)
      return {
        status: message.code500,
        message: message.message500
      }
    }
  }


  async getAddressDetails(userId) {
    try {
      const addresses = await db.address.findAll({
        where: {
          userId: userId,
          addressType: ['Billing', 'Business']
        }
      });

      let billingAddress = null;
      let businessAddress = null;

      addresses.forEach(address => {
        if (address.addressType === 'Billing') {
          billingAddress = address;
        } else if (address.addressType === 'Business') {
          businessAddress = address;
        }
      });

      return {
        success: true,
        data: {
          billingAddress,
          businessAddress
        }
      };
    } catch (error) {
      console.error("Error in getAddressDetails Service:", error.message);
      throw new Error("Failed to fetch address details");
    }
  }

  async updateAddressDetails(userId, addressPayload) {
    try {
      const results = {};
      const addressTypes = ['billingAddress', 'businessAddress'];

      for (const type of addressTypes) {
        if (addressPayload[type]) {
          const addressTypeLabel = type === 'billingAddress' ? 'Billing' : 'Business';

          const [updated] = await db.address.update(addressPayload[type], {
            where: {
              userId: userId,
              addressType: addressTypeLabel
            }
          });

          results[type] = updated > 0
            ? `${addressTypeLabel} address updated successfully`
            : `No ${addressTypeLabel.toLowerCase()} address found to update`;
        }
      }

      return {
        success: true,
        message: results
      };
    } catch (error) {
      console.error("Error in updateAddressDetails Service:", error.message);
      throw new Error("Failed to update address details");
    }
  }
}

module.exports = OrdersService;
