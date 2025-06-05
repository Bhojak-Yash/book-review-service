const { where } = require('sequelize');
const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op


class SalesService {
    constructor(db) {
        this.db = db;
    }

    async search_product(data) {
        try {
            let { id, userType, limit, page } = data
            let usercheckType = userType
            if (userType === "Employee") {
                // console.log(';;;;;;;;;;;;')
                id = data?.data?.employeeOf;
                usercheckType = data?.empOfType
            }
            let Page = Number(page) || 1
            let Limit = Number(limit) || 10
            let Skip = 0
            console.log(id)
            const { search } = data
            let whereCondition = { locked: { [db.Op.not]: true } }
            if (search) {
                whereCondition.PName = { [Op.like]: `%${search}%` }
            }
            console.log(usercheckType)
            if (usercheckType == 'Manufacturer') {
                const { rows: Data, count } = await db.manufacturerStocks.findAndCountAll({
                    attributes: ['SId', 'PId', 'BatchNo', 'ExpDate', 'MRP', 'PTS', 'Scheme', 'BoxQty', 'Loose', 'Stock', 'organisationId', 'location', 'locked'],
                    where: { organisationId: Number(id), locked: { [db.Op.not]: true }, Stock: { [db.Op.gt]: 0 } },
                    include: [
                        {
                            model: db.products,
                            as: 'product',
                            where: whereCondition,
                            required: true,
                            include: [
                            {
                                model: db.manufacturers,
                                as: "manufacturer",
                                attributes: ['manufacturerId', 'companyName'],
                            }
                        ]
                        }
                    ],
                    offset: Skip,
                    limit: Limit
                })
                return {
                    status: message.code200,
                    message: message.message200,
                    currentPage: Page,
                    totalPage: Math.ceil(Number(count) / Limit),
                    totalData: count,
                    apiData: Data
                }
            } else {
                const { rows: Data, count } = await db.stocks.findAndCountAll({
                    attributes: ['SId', 'PId', 'BatchNo', 'ExpDate', 'MRP', 'PTS', 'Scheme', 'BoxQty', 'Loose', 'Stock', 'organisationId', 'location', 'locked'],
                    where: { organisationId: Number(id), locked: { [db.Op.not]: true }, Stock: { [db.Op.gt]: 0 } },
                    include: [
                        {
                            model: db.products,
                            as: 'product',
                            where: whereCondition,
                            required: true,
                            include: [
                            {
                                model: db.manufacturers,
                                as: "manufacturer",
                                attributes: ['manufacturerId', 'companyName'],
                            }
                        ]
                        }
                    ],
                    offset: Skip,
                    limit: Limit
                })
                return {
                    status: message.code200,
                    message: message.message200,
                    currentPage: Page,
                    totalPage: Math.ceil(Number(count) / Limit),
                    totalData: count,
                    apiData: Data
                }
            }
        } catch (error) {
            console.log('search_product service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async create_party(data, party) {
        try {
            let { id, userType } = data
            if (userType === "Employee") {
                // console.log(';;;;;;;;;;;;')
                id = data?.data?.employeeOf;
            }
            const { companyName, address, phone } = party
            if (!companyName || !address || !phone) {
                return {
                    status: message.code400,
                    message: 'Invalid input'
                }
            }
            const check = await db.partyList.findOne({ where: { companyName: party.companyName, organisationId: Number(id) } })
            if (check) {
                return {
                    status: message.code200,
                    message: `${party.companyName} is already exist.`,
                    apiData: check
                }
            }
            const partyData = await db.partyList.create({
                ...party,
                organisationId: Number(id)
            })
            return {
                status: message.code200,
                message: 'Party Created successfully',
                apiData: partyData
            }
        } catch (error) {
            console.log('create_party service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async check_party(data,party){
           let { id, userType } = data
            if (userType === "Employee") {
                // console.log(';;;;;;;;;;;;')
                id = data?.data?.employeeOf;
            }
            const {phone} = party
            const check = await db.partyList.findOne({
                where:{organisationId:Number(id),phone:Number(phone)}
            })
            if(check){
                return {
                    status:message.code200,
                    message:'party already exist.',
                    apiData:check
                }
            }else{
                 return {
                    status:message.code400,
                    message:'No party found with this number',
                    // apiData:check
                }
            }
    }

    async get_party_list(data) {
        try {
            let { id, userType } = data
            if (userType === "Employee") {
                // console.log(';;;;;;;;;;;;')
                id = data?.data?.employeeOf;
            }
            const { page, limit, search, start_date, end_date } = data
            let whereCondition = { organisationId: Number(id) }
            if (search) {
                whereCondition.companyName = { [Op.like]: `%${search}%` }
            }
            if (start_date && end_date) {
                const startDateParts = start_date.split('-');
                const endDateParts = end_date.split('-');

                const formattedStartDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]} 00:00:00`; // "2025-09-02 00:00:00"
                const formattedEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]} 23:59:59`; // "2025-09-02 23:59:59"

                whereCondition.createdAt = {
                    [Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
                };
            }
            let Page = Number(page) || 1
            let Limit = Number(limit) || 10
            let Skip = 0
            const { rows: Data, count } = await db.partyList.findAndCountAll({
                where: whereCondition,
                offset: Skip,
                limit: Limit
            })
            return {
                status: message.code200,
                message: 'Data get successfully',
                currentPage: Page,
                totalPage: Math.ceil(Number(count) / Limit),
                totalData: count,
                apiData: Data
            }

        } catch (error) {
            console.log('get_party_list service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async create_sales(data, sales) {
        try {
            let { id, userType } = data
            if (userType === "Employee") {
                // console.log(';;;;;;;;;;;;')
                id = data?.data?.employeeOf;
            }
            // console.log(sales)
            const salesData = await db.salesHeader.create(
                {
                    date: sales?.order?.date || null,
                    partyId: sales?.order?.partyId,
                    subTotal: sales?.order?.subTotal || null,
                    address: sales?.order?.address || null,
                    discount: sales?.order?.discount || null,
                    totalAmt: sales?.order?.totalAmt || null,
                    balance: sales?.order?.balance || null,
                    SGST: sales?.order?.SGST || null,
                    CGST: sales?.order?.CGST || null,
                    IGST: sales?.order?.IGST || null,
                    organisationId: id,
                    paymentMode: sales?.order?.paymentMode || null,
                    orderStatus: sales?.order?.orderStatus || null,
                    inv_url: sales?.order?.inv_url || null,
                    deliveryType:sales?.order?.deliveryType || null,
                    deliveryDate:sales?.order?.deliveryDate || null,
                    extraDiscountValue:sales?.order?.extraDiscountValue || null,
                    extraDiscountPercent:sales?.order?.extraDiscountPercent || null,
                    advance:sales?.order?.advance || null
                }
            )
            const salesDetailsData = sales?.items?.map((item) => {
                return {
                    "headerId": salesData?.id,
                    "SId": item?.SId,
                    "PId": item?.PId,
                    "qty": item?.qty,
                    "MRP": item?.MRP,
                    "rate": item?.rate,
                    "SGST": item?.SGST,
                    "CGST": item?.CGST,
                    "IGST": item?.IGST,
                    "amount": item?.amount,
                    "scheme":item?.Scheme
                }
            })
            const salesDetails = await db.salesDetails.bulkCreate(salesDetailsData)
            return {
                status: message.code200,
                message: 'Sales created',
                apiData: salesData
            }
        } catch (error) {
            console.log('create_sales service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async get_sales(data) {
        try {
            const { id, userType } = data
            if (userType === "Employee") {
                // console.log(';;;;;;;;;;;;')
                id = data?.data?.employeeOf;
            }
            const { page, limit, search, partyId, status, start_date, end_date } = data
            let whereCondition = { organisationId: Number(id) }
            // if (search) {
            //     whereCondition.companyName = { [Op.like]: `%${search}%` }
            // }
            let Page = Number(page) || 1
            let Limit = Number(limit) || 10
            let Skip = 0
            if (start_date && end_date) {
                const startDateParts = start_date.split('-');
                const endDateParts = end_date.split('-');

                const formattedStartDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]} 00:00:00`; // "2025-09-02 00:00:00"
                const formattedEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]} 23:59:59`; // "2025-09-02 23:59:59"

                whereCondition.createdAt = {
                    [Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
                };
            }
            if (status) {
                whereCondition.orderStatus = status
            }
            if (partyId) {
                whereCondition.partyId = Number(partyId)
            }
            const { rows: Data, count } = await db.salesHeader.findAndCountAll({
                where: whereCondition,
                // attributes:['partyId','createdAt'],
                include: [
                    {
                        model: db.partyList,
                        as: "partyData",
                        attributes: ['id', 'companyName', 'address', 'phone'],
                        required: true
                    }
                ],
                subQuery: false,
                order: [["id", "DESC"]],
                // distinct: true,
                offset: Skip,
                limit: Limit
            })
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: Math.ceil(Number(count) / Limit),
                totalData: count,
                apiData: Data
            }
        } catch (error) {
            console.log('get_sales service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async sales_details(data) {
        try {
            const { id, userType, salesId } = data
             let usercheckType = userType
            if (userType === "Employee") {
                // console.log(';;;;;;;;;;;;')
                id = data?.data?.employeeOf;
                usercheckType = data?.empOfType
            }
            let whereCondition = { organisationId: Number(id), id: Number(salesId) }
            const Data = await db.salesHeader.findOne({
                where: whereCondition,
                include: [
                    {
                        model: db.salesDetails,
                        as: "salesDetails",
                        required: true,
                        include: [
                            {
                                model: db.products,
                                as: 'salesProduct',
                                required: true
                            },
                            {
                                model: usercheckType=='Manufacturer'? db.manufacturerStocks :db.stocks,
                                as: usercheckType=='Manufacturer'? 'salesStock': 'stockssales',
                                required: true
                            }
                        ]
                    }
                ]
            })
            return {
                status: message.code200,
                message: 'Data ge successfully',
                apiData: Data
            }
        } catch (error) {
            console.log('sales_details service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async update_sales(data) {
         try {
             const { id, userType, salesId,inv_url } = data
            if (userType === "Employee") {
                // console.log(';;;;;;;;;;;;')
                id = data?.data?.employeeOf;
            }
             if (!salesId || !inv_url) {
                return {
                    status: message.code400,
                    message: 'Invalid Input'
                }
            }
            await db.retailerSalesHeader.update({ inv_url: inv_url }, { where: { id: Number(salesId), organisationId: Number(id) } })
            return {
                status: message.code200,
                message: 'Invoice craeted successfully'
            }
         } catch (error) {
            console.log('update_sales service error:',error.message)
            return {
                status:message.code500,
                message:error.message
            }
         }
    }

}

module.exports = new SalesService(db);
