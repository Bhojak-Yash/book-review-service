const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');

const getData = async(userType,id)=>{
    // console.log(userType,id)
if(userType==='Manufacturer'){
    return await db.manufacturers.findOne({attributes:['manufacturerId','companyName'],where:{manufacturerId:Number(id)}})
}else if(userType === 'Distributor'){
    return await db.distributors.findOne({attributes:['distributorId','companyName'],where:{distributorId:Number(id)}})
}else if(userType === 'Retailer'){
    return await db.retailers.findOne({attributes:['retailerId','firmName'],where:{retailerId:Number(id)}})
}else if(userType === 'Employee'){
    return await db.employees.findOne({attributes:['employeeId','firstName','lastName'],where:{employeeId:Number(id)}})
}
}

class UsersCartService {
    constructor(db) {
        this.db = db;
    }

    async addToCart(data) {
        try {
            const { id, quantity, SId, orderTo,PId } = data
            if (!id || !quantity || !SId || !orderTo) {
                return {
                    status: message.code400,
                    message: 'Invalid data'
                }
            }

            let check = await db.usercarts.findOne({ where: { orderFrom: Number(id), stockId: Number(SId), orderTo: Number(orderTo) },})
            if (check) {
                await db.usercarts.update(
                    { quantity: Number(quantity) },
                    { where: { id: check.id } }
                )
                check.quantity = Number(quantity)
                return {
                    status: message.code200,
                    message: 'quantity updated succefully',
                    apiData: check
                }
            } else {
                const data = await db.usercarts.create({
                    stockId: Number(SId),
                    orderFrom: Number(id),
                    orderTo: Number(orderTo),
                    quantity: Number(quantity),
                    PId:Number(PId)
                })
                return {
                    status: message.code200,
                    message: 'added to cart',
                    apiData: data
                }
            }
        } catch (error) {
            console.log('addToCart service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async discardCart(data) {
        try {
            const { id } = data
            // Delete all items from the cart for the logged-in user
            const deletedItemsCount = await db.usercarts.destroy({
                where: {
                    orderFrom: Number(id),
                },
            });

            if (deletedItemsCount > 0) {
                return {
                    message: "Cart discarded successfully.",
                    itemsDiscarded: deletedItemsCount,
                };
            } else {
                return {
                    status: 404,
                    message: "No items found in the cart to discard.",
                };
            }
        } catch (error) {
            console.log('discardCart service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async deleteCartItem(data) {
        try {
            const { id, cartItemId } = data
            // console.log(data)
            const cartItem = await db.usercarts.destroy({
                where: {
                    id: Number(cartItemId),
                    orderFrom: Number(id),
                },
            });

            if (!cartItem > 0) {
                return {
                    status: 404,
                    message: "Cart item not found or does not belong to the logged-in user.",
                }
            }
            return {
                status: message.code200,
                message: 'Cart item removed'
            }
        } catch (error) {
            console.log('deleteCartItem service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async getUserCart(data) {
        try {
            const { id,manufacturerId } = data
            console.log(data)
            // Fetch all items in the cart for the logged-in user
            const [manufacturer] = await db.sequelize.query(
                `SELECT 
                    mn.manufacturerId, 
                    mn.companyName,
                    mn.logo,
                    JSON_ARRAYAGG(
                      JSON_OBJECT(
                        'addressType', ad.addressType, 
                        'name', ad.name, 
                        'mobile', ad.mobile, 
                        'city', ad.city, 
                        'state', ad.state
                      )
                    ) AS addresses
                 FROM manufacturers AS mn
                 LEFT JOIN \`address\` AS ad
                   ON ad.userId = mn.manufacturerId
                 WHERE mn.manufacturerId = :manufacturerId
                 GROUP BY mn.manufacturerId, mn.companyName`,
                {
                    replacements: {
                        manufacturerId: Number(manufacturerId),
                        id: Number(id),
                    },
                    type: db.Sequelize.QueryTypes.SELECT,
                }
            );
            let orderFromData =await getData(data?.userType,id)
            const cartItems = await db.usercarts.findAll({
                where: {
                    orderFrom: Number(id),
                    orderTo:Number(manufacturerId)
                },
                include: [
                    {
                        model: db.products, // Include associated product details if needed
                        as: "productDetails",
                        attributes: ["PName","SaltComposition"], // Adjust fields as per your database schema
                    },
                    {
                        model:db.stocks,
                        as:"stockDetails",
                        attributes:['MRP','PTR','BatchNo',"Scheme",'Stock']
                    }
                ],
            });
            // console.log(cartItems)
            // let totalAmount = 0
            const updateCart = await cartItems.map((item)=>{
                // console.log(item)
                // totalAmount+= (Number(item.stockDetails.MRP)*Number(item.quantity))
                return {
                    "id":item.id,
                    "quantity":item.quantity,
                    "stockId":item.stockId,
                    "PId":item.PId,
                    "orderFrom":item.orderFrom,
                    "orderTo":item.orderTo,
                    "createdAt":item.createdAt,
                    "PName":item.productDetails.PName,
                    "SaltComposition":item.productDetails.SaltComposition,
                    "MRP":item.stockDetails.MRP,
                    "PTR":item.stockDetails.PTR,
                    "scheme":item.stockDetails.Scheme || null,
                    "BatchNo":item.stockDetails.BatchNo,
                    "stock":item.stockDetails.Stock
                    // "amount":(Number(item.quantity)*Number(item.stockDetails.MRP))
                }
            })

            // Check if the cart is empty
            if (!cartItems.length) {
                return {
                    status: message.code200,
                    message: "Your cart is empty.",
                    manufacturer:manufacturer,
                    cart: [],
                };
            }

            return {
                status: message.code200,
                message: "Cart fetched successfully.",
                manufacturer:manufacturer,
                cart: updateCart,
                userType:data?.userType,
                orderFrom:orderFromData
            };
        } catch (error) {
            console.error("getUserCart servcie error:", error);
            return { status:message.code500, message: error.message };
        }
    }
}

module.exports = new UsersCartService(db);
