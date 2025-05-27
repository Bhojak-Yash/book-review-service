const db = require('../models/db');
const message = require('../helpers/message')
const Op = db.Op
const axios = require('axios')
const notificationsService = require('../services/notificationsService');
const { includes } = require('lodash');
class AuthService {
    constructor(db) {
        this.db = db;
    }

    async distributer_auth_request(data) {
        try {
            const { authorizedBy, authorizedId } = data
            const check = await db.authorizations.findOne({
                where: {
                    authorizedBy: Number(authorizedBy),
                    authorizedId: Number(authorizedId),
                    // status: 'Pending'
                }
            })
            console.log(check)
            if (check) {
                console.log('check')
                if (check.status == 'Pending') {
                    console.log('pendign')
                    return {
                        status: message.code400,
                        message: 'Your authorization request is already pending. Please wait for approval before submitting a new request'
                    }
                } else if (check.status === 'Not Send' || check.status === 'Rejected') {
                    const Data = await db.authorizations.update(
                        { status: 'Pending' }, // Update fields
                        { where: { id: Number(check.id) } } // Condition
                    );
                    return {
                        status: message.code200,
                        message: 'Authorization request sent',
                        // apiData: Data
                    }
                } else if (check.status === 'Approved') {
                    return {
                        status: 200,
                        message: "Request already approved"
                    }
                }

            }

            const Data = await db.authorizations.create({
                authorizedBy: Number(authorizedBy),
                authorizedId: Number(authorizedId),
                status: 'Pending'
            })


            // Calling the notificationService for Authorization Request
            await notificationsService.createNotification({
                organisationId: authorizedBy,
                category: "Authorization Request",
                title: "Authorization Request Pending",
                description: `You have received an authorization request that is pending approval.`
            });
            // await axios.post(`${process.env.Socket_URL}/auth-request-sent-notification`, {
            //     userId: Number(authorizedBy),
            //     title: "Authorization Request Pending",
            //     description: `You have received an authorization request that is pending approval.`
            // })


            return {
                status: message.code200,
                message: 'Authorization request sent',
                apiData: Data
            }
        } catch (error) {
            console.log('distributer_auth_request error:', error.message)
            return {
                status: message.code500,
                message: error.message,
                apiData: null
            }
        }
    }

    async auth_request_list(data) {
        try {
            console.log(data)
            const { start_date, end_date, search } = data
            const Page = Number(data.page) || 1;
            const Limit = Number(data.limit) || 10;
            let skip = 0
            let id = Number(data?.id)
            if(data?.userType === "Employee"){
                id = data?.data?.employeeOf
            }
            let whereClause = {
                authorizedBy: id,
                status: { [db.Op.in]: ['Pending', 'Approved', 'Rejected'] },
            }
            if (data.status) {
                if (data.status === 'active') {
                    whereClause.status = 'Approved'
                } else if (data.status === 'blocked') {
                    whereClause.status = 'Rejected'
                } else {
                    whereClause.status = data.status
                }
            }
            if (start_date && end_date) {
                const startDateParts = data.start_date.split('-');
                const endDateParts = data.end_date.split('-');

                const formattedStartDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]} 00:00:00`;
                const formattedEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]} 23:59:59`;

                whereClause.createdAt = {
                    [db.Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
                };
            }
            // if (search) {
            //     whereClause[db.Op.in] = [
            //         { "$distributers.companyName$": search },
            //         { "$retailers.firmName$": search }
            //     ]
            // }
            if (search) {
                whereClause[Op.or] = [
                    db.sequelize.literal(`distributers.companyName LIKE '%${search}%'`),
                    db.sequelize.literal(`retailers.firmName LIKE '%${search}%'`)
                ];
            }
            if (Page > 1) {
                skip = (Page - 1) * Limit
            }
            console.log(whereClause)
            const { count, rows } = await db.authorizations.findAndCountAll({
                include: [
                    {
                        model: db.distributors,
                        as: "distributers",
                        // required: true,
                        // where: {
                        //     ...(data.search ? { companyName: { [Op.like]: `%${data.search}%` } } : {}),
                        //     ...(start_date && end_date
                        //         ? { createdAt: { [Op.between]: [new Date(start_date), new Date(end_date)] } }
                        //         : {}),
                        // },
                    },
                    {
                        model: db.retailers,
                        as: 'retailers',
                        required: false
                    },
                    {
                        model: db.address,
                        as: 'address',
                        attributes: ['city', 'State'],
                        where: {
                            addressType: "Business"
                        },
                        required: false
                    }
                ],
                where: whereClause,
                subQuery: false, 
                order: [["id", "DESC"]],
                offset: skip,
                limit: Limit
            })
            const returnData = rows?.map((rows) => {
                return {
                    "id": rows?.id,
                    "authorizedBy": rows?.authorizedBy,
                    "authorizedId": rows?.authorizedId,
                    "status": rows?.status,
                    "poStatus": rows?.poStatus,
                    "creditCycle": rows?.icreditCycled,
                    "createdAt": rows?.createdAt,
                    "updatedAt": rows?.updatedAt,
                    "distributers": rows?.distributers ?
                        {
                            "distributorId": rows?.distributers?.distributorId,
                            "distributorCode": rows?.distributers?.distributorCode,
                            "companyName": rows?.distributers?.companyName,
                            "ownerName": rows?.distributers?.ownerName,
                            "address": rows?.distributers?.address,
                            "phone": rows?.distributers?.phone,
                            "profilePic": rows?.distributers?.profilePic,
                            "email": rows?.distributers?.email,
                            "licence": rows?.distributers?.licence,
                            "status": rows?.distributers?.status,
                            "empMin": rows?.distributers?.empMin,
                            "empMax": rows?.distributers?.empMax,
                            "companyType": rows?.distributers?.companyType,
                            "PAN": rows?.distributers?.PAN,
                            "GST": rows?.distributers?.GST,
                            "CIN": rows?.distributers?.CIN,
                            "FSSAI": rows?.distributers?.FSSAI,
                            "wholeSaleDrugLicence": rows?.distributers?.wholeSaleDrugLicence,
                            "type": rows?.distributers?.type,
                            "createdAt": rows?.distributers?.createdAt,
                            "updatedAt": rows?.distributers?.updatedAt,
                            "city": rows?.address[0]?.city || null,
                            "State": rows?.address[0]?.State || null,
                        } : {
                            "distributorId": rows?.retailers?.retailerId,
                            "distributorCode": rows?.retailers?.retailerCode,
                            "companyName": rows?.retailers?.firmName,
                            "ownerName": rows?.retailers?.ownerName,
                            "address": rows?.retailers?.address,
                            "phone": rows?.retailers?.phone,
                            "profilePic": rows?.retailers?.profilePic,
                            "email": rows?.retailers?.email,
                            "licence": rows?.retailers?.drugLicense,
                            "status": rows?.retailers?.status,
                            "empMin": rows?.retailers?.empMin,
                            "empMax": rows?.retailers?.empMax,
                            "companyType": rows?.retailers?.companyType,
                            "PAN": rows?.retailers?.PAN,
                            "GST": rows?.retailers?.GST,
                            "CIN": rows?.retailers?.CIN,
                            "FSSAI": rows?.retailers?.FSSAI,
                            "wholeSaleDrugLicence": rows?.retailers?.wholeSaleDrugLicence,
                            "type": rows?.retailers?.type,
                            "createdAt": rows?.retailers?.createdAt,
                            "updatedAt": rows?.retailers?.updatedAt,
                            "city": rows?.address[0]?.city || null,
                            "State": rows?.address[0]?.State || null,
                        }
                }
            })
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: Math.ceil(Number(count) / Limit),
                totalItems: count,
                apiData: returnData,

            }
        } catch (error) {
            console.log("auth_request_list errr:", error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async distributor_auth_request_list(data) {
        try {
            // console.log(data)
            const { start_date, end_date } = data
            const Page = Number(data.page) || 1;
            const Limit = Number(data.limit) || 10;
            let skip = 0
            let whereClause = { authorizedBy: Number(data.id) }
            if (data.status) {
                if (data.status === 'active') {
                    whereClause.status = 'Approved'
                } else if (data.status === 'blocked') {
                    whereClause.status = 'Rejected'
                } else {
                    whereClause.status = data.status
                }
            }
            // if (start_date && end_date) {
            //     whereClause.createdAt = {
            //       [Op.between]: [
            //         new Date(start_date),
            //         new Date(end_date),
            //       ],
            //     };
            //   }
            if (Page > 1) {
                skip = (Page - 1) * Limit
            }
            console.log(whereClause)
            const { count, rows } = await db.authorizations.findAndCountAll({
                include: [
                    {
                        model: db.distributors,
                        as: "distributers",
                        required: false,
                        where: {
                            ...(data.search ? { companyName: { [Op.like]: `%${data.search}%` } } : {}),
                            ...(start_date && end_date
                                ? { createdAt: { [Op.between]: [new Date(start_date), new Date(end_date)] } }
                                : {}),
                        },
                    },
                    {
                        model: db.retailers,
                        as: "retailers",
                        required: false,
                        where: {
                            ...(data.search ? { firmName: { [Op.like]: `%${data.search}%` } } : {}),
                            ...(start_date && end_date
                                ? { createdAt: { [Op.between]: [new Date(start_date), new Date(end_date)] } }
                                : {}),
                        },
                    },
                    {
                        model: db.address,
                        as: 'address',
                        attributes: ['State', 'city', 'addressType'],
                        on: db.sequelize.literal('`authorizations`.`authorizedId` = CAST(`address`.`userId` AS UNSIGNED)')
                        // required:false
                    }
                ],
                where: whereClause,
                order: [["id", "DESC"]],
                offset: skip,
                limit: Limit
            })

            const formattedData = rows
                .filter((item) => item.distributers || item.retailers)
                .map((item) => {
                    const isDistributor = !!item.distributers;
                    const base = {
                        email: isDistributor ? item.distributers.email : item.retailers.email,
                        phone: isDistributor ? item.distributers.phone : item.retailers.phone,
                        createdAt: isDistributor ? item.distributers.createdAt : item.retailers.createdAt,
                        userType: isDistributor ? "Distributor" : "Retailer",
                        name: isDistributor ? item.distributers.companyName : item.retailers.firmName,
                        status: item.status,
                    };

                    // Get the "Business" address
                    const businessAddress = item.address?.find((addr) => addr.addressType === "Business");

                    return {
                        ...base,
                        state: businessAddress?.State || null,
                        city: businessAddress?.city || null,
                    };
                });

            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: Math.ceil(Number(count) / Limit),
                totalItems: count,
                apiData: formattedData
            }
        } catch (error) {
            console.log("distributor_auth_request_list service errr:", error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    // async auth_distributer_summary(data) {
    //     try {
    //         const { id, start_date, end_date } = data;
    //         let whereClause = { authorizedBy: Number(id) };

    //         // Date range filter
    //         if (start_date && end_date) {
    //             whereClause.createdAt = {
    //                 [Op.between]: [
    //                     new Date(start_date + " 00:00:00"),
    //                     new Date(end_date + " 23:59:59")
    //                 ],
    //             };
    //         }

    //         // Current period result
    //         const currentResult = await db.authorizations.findAll({
    //             attributes: [
    //                 [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalCount"],
    //                 [db.sequelize.fn("COALESCE", db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), 0), "approvedCount"],
    //                 [db.sequelize.fn("COALESCE", db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), 0), "rejectedCount"]
    //             ],
    //             where: whereClause,
    //             raw: true,
    //         });

    //         const { totalCount = 0, approvedCount = 0, rejectedCount = 0 } = currentResult[0] || {};

    //         // Calculate previous period (Same duration before start_date)
    //         let previousWhereClause = { authorizedBy: Number(id) };

    //         if (start_date && end_date) {
    //             let previousStartDate = new Date(start_date);
    //             let previousEndDate = new Date(end_date);

    //             // Calculate previous period range
    //             const diff = previousEndDate.getTime() - previousStartDate.getTime();
    //             previousStartDate.setTime(previousStartDate.getTime() - diff);
    //             previousEndDate.setTime(previousEndDate.getTime() - diff);

    //             previousWhereClause.createdAt = {
    //                 [Op.between]: [previousStartDate, previousEndDate],
    //             };
    //         }

    //         // Previous period result
    //         const previousResult = await db.authorizations.findAll({
    //             attributes: [
    //                 [db.sequelize.fn("COUNT", db.sequelize.col("id")), "prevTotalCount"],
    //                 [db.sequelize.fn("COALESCE", db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), 0), "prevApprovedCount"],
    //                 [db.sequelize.fn("COALESCE", db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), 0), "prevRejectedCount"]
    //             ],
    //             where: previousWhereClause,
    //             raw: true,
    //         });

    //         const { prevTotalCount = 0, prevApprovedCount = 0, prevRejectedCount = 0 } = previousResult[0] || {};

    //         // Function to calculate percentage change
    //         const getPercentageChange = (current, previous) => {
    //             if (previous === 0) return current === 0 ? 0 : 100;
    //             return ((current - previous) / Math.abs(previous)) * 100;
    //         };

    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //             apiData: {
    //                 totalCount,
    //                 approvedCount,
    //                 rejectedCount,
    //                 totalChange: getPercentageChange(totalCount, prevTotalCount),
    //                 approvedChange: getPercentageChange(approvedCount, prevApprovedCount),
    //                 rejectedChange: getPercentageChange(rejectedCount, prevRejectedCount)
    //             }
    //         };
    //     } catch (error) {
    //         console.log('auth_distributer_summary service error:', error.message);
    //         return {
    //             status: message.code500,
    //             message: error.message
    //         };
    //     }
    // }

    async auth_distributer_summary(data) {
        try {
            const { start_date, end_date } = data;
            let id = data?.id
            console.log(id);
            if(data?.userType === "Employee"){
                id = data?.data?.employeeOf
            }
            console.log(id);
            let whereClause = { authorizedBy: Number(id) };

            // Date range filter
            if (start_date && end_date) {
                whereClause.createdAt = {
                    [Op.between]: [
                        new Date(start_date + " 00:00:00"),
                        new Date(end_date + " 23:59:59"),
                    ],
                };
            }

            // Current period result
            const currentResult = await db.authorizations.findOne({
                attributes: [
                    [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), "approvedCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), "rejectedCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Pending' THEN 1 ELSE 0 END`)), "pendingCount"],
                ],
                where: whereClause,
                raw: true,
            }) || {};

            const { totalCount = 0, approvedCount = 0, rejectedCount = 0, pendingCount = 0 } = currentResult;

            // Calculate previous period (Same duration before start_date)
            let previousWhereClause = { authorizedBy: Number(id) };

            if (start_date && end_date) {
                let previousStartDate = new Date(start_date);
                let previousEndDate = new Date(end_date);

                // Calculate previous period range
                const diff = previousEndDate.getTime() - previousStartDate.getTime();
                previousStartDate.setTime(previousStartDate.getTime() - diff);
                previousEndDate.setTime(previousEndDate.getTime() - diff);

                previousWhereClause.createdAt = {
                    [Op.between]: [previousStartDate, previousEndDate],
                };
            }

            // Previous period result
            const previousResult = await db.authorizations.findOne({
                attributes: [
                    [db.sequelize.fn("COUNT", db.sequelize.col("id")), "prevTotalCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), "prevApprovedCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), "prevRejectedCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Pending' THEN 1 ELSE 0 END`)), "prevPendingCount"],
                ],
                where: previousWhereClause,
                raw: true,
            }) || {};

            const { prevTotalCount = 0, prevApprovedCount = 0, prevRejectedCount = 0, prevPendingCount = 0 } = previousResult;

            // Get count of all Distributors and CNFs
            const distributerCounts = await db.distributors.findAll({
                attributes: [
                    [db.sequelize.fn("COUNT", db.sequelize.col("distributorId")), "totalDistributers"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN type = 'CNF' THEN 1 ELSE 0 END`)), "totalCNFs"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN type = 'Distributer' THEN 1 ELSE 0 END`)), "totalDistributers"],
                ],
                raw: true,
            });

            const { totalDistributers = 0, totalCNFs = 0 } = distributerCounts[0] || {};

            // Function to calculate percentage change
            const getPercentageChange = (current, previous) => {
                if (previous === 0) return current === 0 ? 0 : 100;
                return ((current - previous) / Math.abs(previous)) * 100;
            };

            return {
                status: message.code200,
                message: message.message200,
                apiData: {
                    totalCount,
                    approvedCount,
                    rejectedCount,
                    pendingCount,
                    totalChange: getPercentageChange(totalCount, prevTotalCount),
                    approvedChange: getPercentageChange(approvedCount, prevApprovedCount),
                    rejectedChange: getPercentageChange(rejectedCount, prevRejectedCount),
                    pendingChange: getPercentageChange(pendingCount, prevPendingCount),
                    totalDistributers,
                    totalCNFs,
                },
            };
        } catch (error) {
            console.log('auth_distributer_summary service error:', error.message);
            return {
                status: message.code500,
                message: error.message,
            };
        }
    }

    async auth_page_card_data_distributor(data) {
        try {
            const { start_date, end_date } = data;
            let id = data?.id
            if(data?.userType === "Employee"){
                id = data?.data?.employeeOf
            }
            let whereClause = {
                authorizedBy: Number(id),
                status: { [db.Op.in]: ['Pending', 'Approved', 'Rejected'] }
            };

            // Date range filter
            if (start_date && end_date) {
                whereClause.createdAt = {
                    [Op.between]: [
                        new Date(start_date + " 00:00:00"),
                        new Date(end_date + " 23:59:59"),
                    ],
                };
            }

            // Current period result
            const currentResult = await db.authorizations.findOne({
                attributes: [
                    [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), "approvedCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), "rejectedCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Pending' THEN 1 ELSE 0 END`)), "pendingCount"],
                ],
                where: whereClause,
                raw: true,
            }) || {};

            const { totalCount = 0, approvedCount = 0, rejectedCount = 0, pendingCount = 0 } = currentResult;

            // Calculate previous period (Same duration before start_date)
            let previousWhereClause = { authorizedBy: Number(id) };

            if (start_date && end_date) {
                let previousStartDate = new Date(start_date);
                let previousEndDate = new Date(end_date);

                // Calculate previous period range
                const diff = previousEndDate.getTime() - previousStartDate.getTime();
                previousStartDate.setTime(previousStartDate.getTime() - diff);
                previousEndDate.setTime(previousEndDate.getTime() - diff);

                previousWhereClause.createdAt = {
                    [Op.between]: [previousStartDate, previousEndDate],
                };
            }

            // Previous period result
            const previousResult = await db.authorizations.findOne({
                attributes: [
                    [db.sequelize.fn("COUNT", db.sequelize.col("id")), "prevTotalCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), "prevApprovedCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), "prevRejectedCount"],
                    [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Pending' THEN 1 ELSE 0 END`)), "prevPendingCount"],
                ],
                where: previousWhereClause,
                raw: true,
            }) || {};

            const { prevTotalCount = 0, prevApprovedCount = 0, prevRejectedCount = 0, prevPendingCount = 0 } = previousResult;

            // Get count of all Distributors and CNFs
            console.log(whereClause)
            const retailerCount = await db.authorizations.count({
                where: whereClause,
                include: [{
                    model: db.retailers,
                    as: "retailers",
                    required: true,
                }]
            });

            const distributorCount = await db.authorizations.count({
                where: whereClause,
                include: [{
                    model: db.distributors,
                    as: 'distributor',
                    required: true,
                }]
            });
            const getPercentageChange = (current, previous) => {
                if (previous === 0) return current === 0 ? 0 : 100;
                return ((current - previous) / Math.abs(previous)) * 100;
            };

            return {
                status: message.code200,
                message: message.message200,
                apiData: {
                    totalCount,
                    approvedCount,
                    rejectedCount,
                    pendingCount,
                    totalChange: getPercentageChange(totalCount, prevTotalCount),
                    approvedChange: getPercentageChange(approvedCount, prevApprovedCount),
                    rejectedChange: getPercentageChange(rejectedCount, prevRejectedCount),
                    pendingChange: getPercentageChange(pendingCount, prevPendingCount),
                    retailerCount,
                    distributorCount
                },
            };
        } catch (error) {
            console.log('auth_page_card_data_distributor service error:', error.message);
            return {
                status: message.code500,
                message: error.message,
            };
        }
    }

    async stop_po(data) {
        try {
            const { userId } = data
            let id = data?.id
            if(data?.userType === "Employee"){
                id = data?.data?.employeeOf
            }
            console.log(userId, id);
            if (!userId) {
                return {
                    status: message.code400,
                    message: 'userId is required'
                }
            }
            await db.authorizations.update(
                { poStatus: 'Stopped' },
                { where: { authorizedId: Number(userId), authorizedBy: Number(id) } }
            )
            return {
                status: message.code200,
                message: 'Po stopped'
            }
        } catch (error) {
            console.log('stop_po service error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

    async update_auth_request(data) {
        try {
            const { userId, status } = data
            let id = data?.id
            if(data?.userType === "Employee"){
                id = data?.data?.employeeOf
            }
            console.log(id);
            if (!id || !userId || !status) {
                return {
                    status: message.code400,
                    message: 'Invalid params'
                }
            }
            let creditCycle = 0
            if (status === 'Approved') {
                creditCycle = 7
            }
            await db.authorizations.update({ status: status, creditCycle: creditCycle }, { where: { authorizedId: userId, authorizedBy: id } })


            const statusMessage = data.status || "Pending";
            const newNotification = await notificationsService.createNotification({
                organisationId: userId,
                category: "Authorization Request",
                title: `Authorization Request: ${statusMessage}`,
                description: `An authorization request has been ${statusMessage}.`
            });

            // Check if notification was created successfully before updating the status
            if (newNotification.status === 200 && newNotification.data) {
                await notificationsService.updateNotificationStatus(newNotification.data.id, "Unread");
            }
            // await axios.post(`${process.env.Socket_URL}/auth-request-action-notification`, {
            //     userId: Number(userId),
            //     title: `Authorization Request: ${statusMessage}`,
            //     description: `An authorization request has been ${statusMessage}.`
            // })


            return {
                status: message.code200,
                message: message.message200,
            }
        } catch (error) {
            console.log('update_auth_request service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async authorizedBy_users(data) {
        try {
            const { id, search } = data
            const checkId = Number(id)
            const Data = await db.users.findAll(
                {
                    // attributes: ['authorizedBy'],
                    // where: {  userType: { [db.Op.in]: ['Distributor', 'Manufacturer'] } },
                    include: [
                        {
                            model: db.distributors,
                            as: "disuser",
                            attributes: ['companyName', 'distributorId', 'type'],
                            // where: {type:'CNF'}
                        },
                        {
                            model: db.manufacturers,
                            as: "manufacturer",
                            attributes: ['companyName', 'manufacturerId'],
                            // where: search ? { companyName: { [db.Op.like]: `%${search}%` } } : {}
                        }
                    ],
                    // group: ['authorizedBy'],
                    where: {
                        // userType: { [db.Op.in]: ['Distributor', 'Manufacturer'] },
                        [db.Op.or]: [
                            { '$disuser.type$': 'CNF' },
                            { '$manufacturer.manufacturerId$': { [db.Op.ne]: null } }
                        ]
                    }
                }
            )
            // console.log(Data)
            // const Data = await db.authorizations.findAll({
            //     attributes: ['authorizedBy'],
            //     where: {
            //       authorizedId: checkId,
            //       status: { [db.Op.in]: ['Not Send', 'Approved'] }
            //     },
            //     include: [
            //       {
            //         model: db.distributors,
            //         as: "distributor",
            //         attributes: ['companyName', 'distributorId', 'type']
            //       },
            //       {
            //         model: db.manufacturers,
            //         as: "manufacturer",
            //         attributes: ['companyName', 'manufacturerId']
            //       }
            //     ],
            //     group: ['authorizedBy'],
            //     having: {
            //       [db.Op.or]: [
            //         { '$distributor.distributorId$': { [db.Op.ne]: null } },
            //         { '$manufacturer.manufacturerId$': { [db.Op.ne]: null } }
            //       ]
            //     }
            //   })


            const finalResult = Data?.map((item) => {
                return {
                    "companyName": item.disuser.length > 0 ? item.disuser[0]?.companyName : item.manufacturer[0]?.companyName,
                    "id": item.disuser.length > 0 ? item.disuser[0]?.distributorId : item.manufacturer[0]?.manufacturerId,
                    "type": item.disuser.length > 0 ? item.disuser[0]?.type : 'Manufacturer'
                }
            })
            return {
                status: message.code200,
                message: message.message200,
                apiData: finalResult
            }
        } catch (error) {
            console.log('authorizedBy_users service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async dis_details_card_data(data) {
        try {
            const { id, userId, startDate, endDate, userType } = data
            const checkId = userType === "Employee" ? Number(data?.data?.employeeOf) : Number(id);
            const { Op, fn, col, literal } = db.sequelize;
            let whereClause = {
                orderTo: Number(checkId),
                orderFrom: Number(userId)
            }
            let whereReturn = {
                returnTo: Number(checkId),
                returnFrom: Number(userId)
            }
            if (startDate && endDate) {
                const startDateParts = data.startDate.split('-');
                const endDateParts = data.endDate.split('-');

                const formattedStartDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]} 00:00:00`;
                const formattedEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]} 23:59:59`;

                whereClause.orderDate = {
                    [db.Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
                };
                whereReturn.returnDate = {
                    [db.Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
                };
            }
            //   if (startDate && endDate) {
            //     whereClause.orderDate = {
            //         [db.Op.between]: [
            //             new Date(startDate + " 00:00:00"),
            //             new Date(endDate + " 23:59:59"),
            //         ],
            //     }
            //     whereReturn.returnDate = {
            //         [db.Op.between]: [
            //             new Date(startDate + " 00:00:00"),
            //             new Date(endDate + " 23:59:59"),
            //         ],
            //     };
            // }

            const userData = await db.users.findOne({
                where: { id: Number(userId) },
                attributes: ['id', 'status'],
                include: [
                    {
                        model: db.distributors,
                        as: 'disuser',
                        attributes: ['distributorId', 'companyName', 'phone', 'email', 'profilePic', 'GST', 'CIN']
                    },
                    {
                        model: db.retailers,
                        as: 'reuser',
                        attributes: ['retailerId', 'firmName', 'phone', 'email', 'profilePic', 'GST', 'CIN']
                    },
                    {
                        model: db.address,
                        as: 'address',
                        attributes: ['addLine1', 'addLine2', 'city', 'state', 'addressType']
                    }
                ]
            })

            const orderStats = await db.orders.findAll({
                attributes: [
                    [fn('COUNT', col('id')), 'totalOrders'],
                    [
                        fn('SUM', literal(`CASE WHEN orderStatus = 'Settled' THEN 1 ELSE 0 END`)),
                        'completedCount'
                    ],
                    [
                        fn('SUM', literal(`CASE WHEN orderStatus != 'Settled' THEN 1 ELSE 0 END`)),
                        'pendingCount'
                    ],
                    [
                        fn('SUM', literal(`CASE WHEN balance > 0 THEN 1 ELSE 0 END`)),
                        'pendingPaymentCount'
                    ],
                    [fn('SUM', col('invAmt')), 'totalInvoiceAmount'],
                    [fn('MAX', col('orderDate')), 'lastOrderDate'],
                    [fn('MIN', col('orderDate')), 'firstOrderDate'],
                ],
                where: whereClause,
                raw: true
            });

            const returnStats = await db.returnHeader.findAll({
                attributes: [
                    [fn('COUNT', col('returnId')), 'totalReturns'],
                    [
                        fn('SUM', literal(`CASE WHEN cNAmt IS NOT NULL THEN 1 ELSE 0 END`)),
                        'cnIssuedCount'
                    ],
                    [
                        fn('SUM', literal(`CASE WHEN cNAmt IS NOT NULL THEN cNAmt ELSE 0 END`)),
                        'totalCNAmt'
                    ]
                ],
                where: whereReturn,
                raw: true
            });

            const auth = await db.authorizations.findOne({
                where: {
                    authorizedBy: Number(checkId),
                    authorizedId: Number(userId)
                },
                attributes: ['status']
            })

            const returnData = {
                user: {
                    userSince: orderStats?.length > 0 ? orderStats[0]?.firstOrderDate : null,
                    userId: userData?.dataValues?.disuser?.length > 0 ? userData?.dataValues?.disuser[0]?.distributorId : userData?.dataValues?.reuser[0]?.retailerId || null,
                    companyName: userData?.dataValues?.disuser?.length > 0 ? userData?.dataValues?.disuser[0]?.companyName : userData?.dataValues?.reuser[0]?.companyName || null,
                    lastOrderDate: orderStats.length > 0 ? orderStats[0]?.lastOrderDate : null,
                    phone: userData?.dataValues?.disuser?.length > 0 ? userData?.dataValues?.disuser[0]?.phone : userData?.dataValues?.reuser[0]?.phone || null,
                    email: userData?.dataValues?.disuser?.length > 0 ? userData?.dataValues?.disuser[0]?.email : userData?.dataValues?.reuser[0]?.email || null,
                    profilePic: userData?.dataValues?.disuser?.length > 0 ? userData?.dataValues?.disuser[0]?.profilePic : userData?.dataValues?.reuser[0]?.profilePic || null,
                    CIN: userData?.dataValues?.disuser?.length > 0 ? userData?.dataValues?.disuser[0]?.CIN : userData?.dataValues?.reuser[0]?.CIN || null,
                    GST: userData?.dataValues?.disuser?.length > 0 ? userData?.dataValues?.disuser[0]?.GST : userData?.dataValues?.reuser[0]?.GST || null,
                },
                address: userData?.dataValues?.address,
                orders: {
                    allOrders: orderStats?.length > 0 ? orderStats[0]?.totalOrders : 0,
                    completedCount: orderStats?.length > 0 ? orderStats[0]?.completedCount : 0,
                    pendingCount: orderStats?.length > 0 ? orderStats[0]?.pendingCount : 0,
                    pendingPayment: orderStats?.length > 0 ? orderStats[0]?.pendingPaymentCount : 0,
                    totalInvoiceAmount: orderStats?.length > 0 ? orderStats[0]?.totalInvoiceAmount : 0,
                },
                returns: {
                    totalReturns: returnStats?.length > 0 ? returnStats[0]?.totalReturns : 0,
                    cnIssuedCount: returnStats?.length > 0 ? returnStats[0]?.cnIssuedCount : 0,
                    totalCNAmt: returnStats?.length > 0 ? returnStats[0]?.totalCNAmt : 0,
                },
                authStatus: auth ? auth?.dataValues?.status : 'Not Send'
            }
            return {
                status: message.code200,
                message: message.message200,
                apiData: returnData
            }
        } catch (error) {
            console.log('dis_details_card_data service error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

}

module.exports = new AuthService(db);
