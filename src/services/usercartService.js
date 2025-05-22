const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');

const getData = async (userType, id) => {
    // console.log(userType,id)
    if (userType === 'Manufacturer') {
        return await db.manufacturers.findOne({ attributes: ['manufacturerId', 'companyName'], where: { manufacturerId: Number(id) } })
    } else if (userType === 'Distributor') {
        return await db.distributors.findOne({ attributes: ['distributorId', 'companyName'], where: { distributorId: Number(id) } })
    } else if (userType === 'Retailer') {
        return await db.retailers.findOne({ attributes: ['retailerId', 'firmName'], where: { retailerId: Number(id) } })
    } else if (userType === 'Employee') {
        return await db.employees.findOne({ attributes: ['employeeId', 'firstName', 'lastName'], where: { employeeId: Number(id) } })
    }
}

class UsersCartService {
    constructor(db) {
        this.db = db;
    }

    async addToCart(data) {
        try {
            const { id, quantity, SId, orderTo, PId } = data
            // console.log(data,'check usercart')
            // console.log(id,quantity,SId,orderTo,';;;;;;;')
            if (!id || !String(quantity) || !SId || !orderTo) {
                return {
                    status: message.code400,
                    message: 'Invalid data'
                }
            }
            // console.log(data)
            let check = await db.usercarts.findOne({ where: { orderFrom: Number(id), stockId: Number(SId), orderTo: Number(orderTo) }, })
            // console.log(check)
            if (check) {
                if (quantity == 0) {
                    await db.usercarts.destroy({
                        where: {
                            id: Number(check.id),
                        },
                    });
                }
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
                    PId: Number(PId)
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
            const { userType, manufacturerId } = data
            let id = data?.id
            // console.log(id)
            if(data?.userType === "Employee" ){
                id = data?.data?.employeeOf
            }
            // console.log(id)
            // const userData = awa
            let distributor;
            let manufacturer;

            const user = await db.users.findOne({
                where: { id: manufacturerId },
                attributes: ['userType'],
            });
            let orderTo_UserType = user?.userType;

            // Fetch all items in the cart for the logged-in user
            if (orderTo_UserType === 'Manufacturer') {
                [manufacturer] = await db.sequelize.query(
                    `SELECT 
                    mn.manufacturerId, 
                    mn.companyName,
                    mn.logo,
                    us.userType,
                    JSON_ARRAYAGG(
                      JSON_OBJECT(
                        'addressType', ad.addressType, 
                        'name', ad.name, 
                        'mobile', ad.mobile, 
                        'city', ad.city, 
                        'state', ad.state,
                        'email', ad.email
                      )
                    ) AS addresses
                 FROM manufacturers AS mn
                 LEFT JOIN \`address\` AS ad
                   ON ad.userId = mn.manufacturerId
                   left join \`users\` as us
                   on mn.manufacturerId=us.id
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
            } else {
                [manufacturer] = await db.sequelize.query(
                    `SELECT 
                    mn.distributorId, 
                    mn.companyName,
                    mn.profilePic,
                    mn.GST,
                        mn.PAN,
                    JSON_ARRAYAGG(
                      JSON_OBJECT(
                       'addressType', ad.addressType, 
                            'name', ad.name, 
                            'mobile', ad.mobile, 
                            'email', ad.email,
                            'addLine1',ad.addLine1,
                            'addLine2',ad.addLine2,
                            'State',ad.State,
                            'city',ad.city,
                            'country',ad.country,
                            'pinCode',ad.pinCode
                      )
                    ) AS addresses
                 FROM distributors_new AS mn
                 LEFT JOIN \`address\` AS ad
                   ON ad.userId = mn.distributorId
                 WHERE mn.distributorId = :manufacturerId
                 GROUP BY mn.distributorId, mn.companyName`,
                    {
                        replacements: {
                            manufacturerId: Number(manufacturerId),
                            id: Number(id),
                        },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                );
            }

            if (userType === 'retailer' || userType === 'Retailer') {
                [distributor] = await db.sequelize.query(
                    `SELECT 
                        mn.retailerId, 
                        mn.firmName,
                        mn.profilePic,
                        mn.GST,
                        mn.PAN,
                        JSON_ARRAYAGG(
                          JSON_OBJECT(
                            'addressType', ad.addressType, 
                            'name', ad.name, 
                            'mobile', ad.mobile, 
                            'email', ad.email,
                            'addLine1',ad.addLine1,
                            'addLine2',ad.addLine2,
                            'State',ad.State,
                            'city',ad.city,
                            'country',ad.country,
                            'pinCode',ad.pinCode
                          )
                        ) AS addresses
                     FROM retailers AS mn
                     LEFT JOIN \`address\` AS ad
                       ON ad.userId = mn.retailerId
                     WHERE mn.retailerId = :id
                     GROUP BY mn.retailerId, mn.firmName`,
                    {
                        replacements: {
                            manufacturerId: Number(manufacturerId),
                            id: Number(id),
                        },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                );
            } else {
                console.log('[[[[[[[[[[[[[[[[[[[[[[[[[[[[', manufacturerId, id)
                const [distributorr] = await db.sequelize.query(
                    `SELECT 
                    mn.distributorId, 
                    mn.companyName,
                    mn.profilePic,
                    mn.GST,
                        mn.PAN,
                    JSON_ARRAYAGG(
                      JSON_OBJECT(
                       'addressType', ad.addressType, 
                            'name', ad.name, 
                            'mobile', ad.mobile, 
                            'email', ad.email,
                            'addLine1',ad.addLine1,
                            'addLine2',ad.addLine2,
                            'State',ad.State,
                            'city',ad.city,
                            'country',ad.country,
                            'pinCode',ad.pinCode
                      )
                    ) AS addresses
                 FROM distributors_new AS mn
                 LEFT JOIN \`address\` AS ad
                   ON ad.userId = mn.distributorId
                 WHERE mn.distributorId = :id
                 GROUP BY mn.distributorId, mn.companyName`,
                    {
                        replacements: {
                            manufacturerId: Number(manufacturerId),
                            id: Number(id),
                        },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                );
                distributor = distributorr
                console.log(distributorr, '\\\\\\\\\\\\\\\\\\')
            }
            // console.log(distributor,';;;;;;;;;;;;;')
            let orderFromData = await getData(data?.userType, id)
            const tableName = manufacturer?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
            const assss = manufacturer?.userType === 'Manufacturer' ? "stockDetailss" : "stockDetails";
            const attr = manufacturer?.userType === 'Manufacturer' ? ['MRP', 'BatchNo', "Scheme", 'Stock', 'PTS'] : ['MRP', 'BatchNo', "Scheme", 'Stock', 'PTS', 'PTR']
            // console.log(assss)
            const cartItems = await db.usercarts.findAll({
                where: {
                    orderFrom: Number(id),
                    orderTo: Number(manufacturerId)
                },
                include: [
                    {
                        model: db.products,
                        as: "productDetails",
                        attributes: ["PName", "SaltComposition", 'ProductForm', 'PackagingDetails'],
                    },
                    {
                        model: tableName,
                        as: assss,
                        attributes: attr
                    }
                ],
            });
            //......................................................................................................
            const getStateFromAddress = (user) => {
                const billingAddress = user?.addresses?.find(addr => addr.addressType === 'Billing');
                return billingAddress?.State?.trim() || null;
            };

            const fromState = getStateFromAddress(distributor);
            const toState = getStateFromAddress(manufacturer);

            let taxType = null;
            if (fromState && toState) {
                taxType = (fromState === toState) ? 'SGST_CGST' : 'IGST';
            }

            console.log("From State:", fromState);
            console.log("To State:", toState);
            console.log("Tax Type:", taxType);
            //.......................................................................................................
            let isManufacturer = false;
            if (manufacturer?.userType === 'Manufacturer') {
                isManufacturer = true;
            }
            let isaddressRequired = true
            if(fromState){
                isaddressRequired=false
            }
            console.log("isManufacturer", isManufacturer);
            // console.log("PTR", PTR);
            // console.log("PTS", PTS);
            // let totalAmount = 0
            const updateCartt = await Promise.all(cartItems.map(async (item) => {
                const aass = item?.stockDetailss?.Stock || item?.stockDetails?.Stock || 0;
                console.log(aass);

                if (aass <= 0) {
                    console.log('check other stock with same pid and BatchNo and organisationId');
                    const BatchNo = item?.stockDetails?.BatchNo || item?.stockDetailss?.BatchNo;
                    const checkOtherStock = await tableName.findOne({
                        where: {
                            PId: item?.PId,
                            BatchNo: BatchNo,
                            organisationId: Number(manufacturerId),
                            Stock: { [db.Op.gt]: 0 }
                        }
                    });

                    if (!checkOtherStock) {
                        return null;
                    }
                }

                return {
                    id: item?.id,
                    quantity: item?.quantity,
                    stockId: item?.stockId,
                    PId: item?.PId,
                    orderFrom: item?.orderFrom,
                    orderTo: item?.orderTo,
                    createdAt: item?.createdAt,
                    PName: item?.productDetails?.PName,
                    SaltComposition: item?.productDetails?.SaltComposition,
                    MRP: item?.stockDetails?.MRP || item?.stockDetailss?.MRP,
                    PTR: isManufacturer ? item?.stockDetailss?.PTS : item?.stockDetails?.PTR || 0,
                    isManufacturer: isManufacturer,
                    scheme: item?.stockDetails?.Scheme || item?.stockDetailss?.Scheme || null,
                    BatchNo: item?.stockDetails?.BatchNo || item?.stockDetailss?.BatchNo,
                    stock: item?.stockDetails?.Stock || item?.stockDetailss?.Stock,
                    ProductForm: item?.productDetails?.ProductForm,
                    PackagingDetails: item?.productDetails?.PackagingDetails
                };
            }));

            // Filter out nulls if any were returned (i.e., when checkOtherStock was falsy)
            const updateCart = updateCartt.filter(Boolean);


            // Check if the cart is empty
            if (!cartItems.length) {
                if (userType === 'Retailer') {
                    return {
                        status: message.code200,
                        message: "Your cart is empty.",
                        isaddressRequired,
                        manufacturer: manufacturer,
                        retailer: distributor, // Send data in `retailers` key
                        cart: [],
                    };
                } else {
                    return {
                        status: message.code200,
                        message: "Your cart is empty.",
                         isaddressRequired,
                        manufacturer: manufacturer,
                        distributor: distributor, // Send data in `distributor` key
                        cart: [],
                    };
                }

            }
            if (userType === 'Retailer') {
                // console.log('ppppppppppppppppretailers',manufacturer,distributor)
                return {
                    status: message.code200,
                    message: "Cart fetched successfully.",
                    isaddressRequired,
                    manufacturer: manufacturer,
                    retailer: distributor,
                    cart: updateCart,
                    userType: data?.userType,
                    orderFrom: orderFromData
                };
            }
            return {
                status: message.code200,
                message: "Cart fetched successfully.",
                isaddressRequired,
                manufacturer: manufacturer,
                distributor,
                cart: updateCart,
                userType: data?.userType,
                orderFrom: orderFromData,
                taxType
            };
        } catch (error) {
            console.error("getUserCart servcie error:", error);
            return { status: message.code500, message: error.message };
        }
    }
}

module.exports = new UsersCartService(db);
