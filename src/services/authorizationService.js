const db = require('../models/db');
const message = require('../helpers/message')
const Op = db.Op
const notificationsService = require('../services/notificationsService')
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
            if (check) {
                if (check.status === 'Pending') {
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
                description: `You Received an authorization request & is pending approval.`
            });


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
                        required: true,
                        where: {
                            ...(data.search ? { companyName: { [Op.like]: `%${data.search}%` } } : {}),
                            ...(start_date && end_date
                                ? { createdAt: { [Op.between]: [new Date(start_date), new Date(end_date)] } }
                                : {}),
                        },
                    }
                ],
                where: whereClause,
                order: [["id", "DESC"]],
                offset: skip,
                limit: Limit
            })
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: Math.ceil(Number(count) / Limit),
                totalItems: count,
                apiData: rows
            }
        } catch (error) {
            console.log("auth_request_list errr:", error.message)
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
            const { id, start_date, end_date } = data;
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

    async stop_po(data) {
        try {
            const { id, userId } = data
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
            const { id, userId, status } = data
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
            const { id,search } = data
            const checkId = Number(id)
            const Data = await db.authorizations.findAll(
                {
                    attributes: ['id','authorizedBy'],
                    where: { authorizedId: checkId ,status:{[db.Op.in]:['Not Send','Approved']}},
                    include:[
                        {
                            model:db.distributors,
                            as:"distributor",
                            attributes:['companyName','distributorId','type'],
                            // where: search ? { companyName: { [db.Op.like]: `%${search}%` } } : {}
                        },
                        {
                            model:db.manufacturers,
                            as:"manufacturer",
                            attributes:['companyName','manufacturerId'],
                            // where: search ? { companyName: { [db.Op.like]: `%${search}%` } } : {}
                        }
                    ],
                    where: {
                        [db.Op.or]: [
                            { '$distributor.distributorId$': { [db.Op.ne]: null } },
                            { '$manufacturer.manufacturerId$': { [db.Op.ne]: null } }
                        ]
                    }
                }
            )

            const finalResult  = Data?.map((item)=>{
                return {
                    "companyName":item.distributor? item.distributor?.companyName : item.manufacturer?.companyName,
                    "id":item.distributor? item.distributor?.distributorId : item.manufacturer?.manufacturerId,
                    "type":item.distributor? item.distributor?.type: 'Manufacturer'
                }
            })
            return {
                status:message.code200,
                message:message.message200,
                apiData:finalResult
            }
        } catch (error) {
            console.log('authorizedBy_users service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

}

module.exports = new AuthService(db);
