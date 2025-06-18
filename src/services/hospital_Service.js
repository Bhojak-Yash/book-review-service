const db = require('../models/db');
const { Op } = db.Sequelize;
const message = require('../helpers/message');
const sequelize = require('sequelize');

const formatSize = (size) => {
    let bytes = Number(size);
    if (isNaN(bytes)) return null;

    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  };

// exports.create_Hospital = async (hospitalData) => {
//     const transaction = await db.sequelize.transaction();

//     try {
//         let { hospitalName, email } = hospitalData;

//         if (!hospitalName || !email) {
//             throw { status: 400, message: "hospitalName and email are required." };
//         }

//         const existingUser = await db.users.findOne({
//             where: { userName: email },
//             transaction
//         });

//         if (existingUser) {
//             await transaction.rollback();
//             return {
//                 status: 400,
//                 message: 'A hospital with this email already exists.',
//             };
//         }

//         // Create user
//         const defaultPassword = Math.random().toString(36).slice(-8);
//         const hashedPassword = await bcrypt.hash(defaultPassword, 10);
//         let status = email ? "Active" : "Inactive";

//         email = email.toLowerCase();
//         hospitalData.email = email;

//         const newUser = await db.users.create({
//             userName: email,
//             password: hashedPassword,
//             userType: "Hospital",
//             status
//         }, { transaction });

//         const hospitalCode = `H-${newUser.id}`;

//         const newHospital = await db.hospital.create({
//             ...hospitalData, 
//             hospitalId: newUser.id,
//             hospitalCode,
//             status,
//         }, { transaction });

//         // Send email
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL,
//                 pass: process.env.EMAIL_PASSWORD
//             }
//         });

//         const mailOptions = {
//             from: process.env.EMAIL,
//             to: email,
//             subject: 'Hospital Account Details',
//             text: `Your hospital account has been successfully created.\n\nYour email: ${email}\nYour password: ${defaultPassword}\n\nLogin Link: ${process.env.login_hospital}`
//         };

//         try {
//             await transporter.sendMail(mailOptions);
//             console.log("Email sent successfully!");
//         } catch (emailError) {
//             console.error("Email sending failed:", emailError);
//         }

//         // Commit the transaction
//         await transaction.commit();

//         // Return the created hospital
//         const updatedHospital = await db.hospital.findByPk(newHospital.hospitalId);
//         return {
//             status: 200,
//             message: "Hospital created successfully",
//             updatedHospital
//         }
//     } catch (error) {
//         if (transaction) await transaction.rollback();
//         console.error("Error in create_Hospital service:", error);
//         throw error;
//     }
// };

exports.get_Hospital = async ({ page = 1, limit, hospitalName, status, startDate, endDate }) => {
    try {
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = {};

        if (hospitalName && hospitalName.trim().length >= 3) {
            whereClause.hospitalName = { [Op.like]: `%${hospitalName}%` };
        }

        if (status && ["Active", "Inactive"].includes(status)) {
            whereClause.status = status;
        }

        if (startDate && endDate) {
            const adjustedStartDate = new Date(startDate);
            const adjustedEndDate = new Date(endDate);

            adjustedStartDate.setUTCHours(0, 0, 0, 0);
            adjustedEndDate.setUTCHours(23, 59, 59, 999);

            const formattedStart = adjustedStartDate.toISOString().slice(0, 19).replace("T", " ");
            const formattedEnd = adjustedEndDate.toISOString().slice(0, 19).replace("T", " ");

            whereClause.createdAt = { [Op.between]: [formattedStart, formattedEnd] };
        }

        const totalHospitals = await db.hospital.count({ where: whereClause });

        const hospitals = await db.hospital.findAll({
            where: whereClause,
            attributes: [
                'hospitalId',
                'hospitalCode',
                'hospitalName',
                'type',
                'phone',
                'email',
                'address',
                'city',
                'state',
                'GST',
                'license',
                'status',
                'createdAt',
                'updatedAt'
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        if (!hospitals.length) {
            return {
                status: 400,
                message: "No hospitals found."
            };
        }

        const formattedHospitals = hospitals.map(hospital => ({
            hospitalId: hospital.hospitalId,
            hospitalCode: hospital.hospitalCode,
            hospitalName: hospital.hospitalName,
            type: hospital.type,
            phone: hospital.phone,
            email: hospital.email,
            address: hospital.address,
            city: hospital.city,
            state: hospital.state,
            GST: hospital.GST,
            license: hospital.license,
            status: hospital.status,
            createdAt: hospital.createdAt,
            updatedAt: hospital.updatedAt
        }));

        return {
            status: 200,
            message: "Hospitals retrieved successfully",
            data: {
                totalHospitals,
                totalPages: Math.ceil(totalHospitals / limit),
                currentPage: page,
                hospitals: formattedHospitals
            }
        };

    } catch (error) {
        console.error("Error in get_Hospital:", error);
        return {
            status: 500,
            message: "Failed to fetch hospitals",
            error: error.message || "Internal Server Error"
        };
    }
};

exports.get_HospitalById = async ({ hospitalId }) => {
    try {
        if (!hospitalId) {
            return {
                status: 400,
                message: "hospitalId is required."
            };
        }

        const hospital = await db.hospital.findOne({
            where: { hospitalId }
        });

        if (!hospital) {
            return {
                status: 404,
                message: "Hospital not found."
            };
        }

        return {
            status: 200,
            message: "Hospital retrieved successfully",
            data: hospital
        };

    } catch (error) {
        console.error("Error in get_HospitalById:", error);
        return {
            status: 500,
            message: "Failed to fetch hospital",
            error: error.message || "Internal Server Error"
        };
    }
};

exports.update_Hospital = async (hospitalId, updateData) => {
    const transaction = await db.sequelize.transaction();
    try {
        if (!hospitalId) {
            return { status: 400, message: "hospitalId is required in query" };
        }

        const hospital = await db.hospital.findOne({ where: { hospitalId } });

        if (!hospital) {
            return { status: 400, message: "Hospital not found" };
        }

        const hospitalFields = {
            hospitalName: updateData.hospitalName,
            type: updateData.type,
            phone: updateData.phone,
            email: updateData.email,
            address: updateData.address,
            city: updateData.city,
            state: updateData.state,
            GST: updateData.GST,
            license: updateData.license,
            status: updateData.status,
        };

        await db.hospital.update(hospitalFields, {
            where: { hospitalId },
            transaction
        });

        // ---------------- Address Handling ----------------
        const distributorId = hospitalId;
        const businessAdd = updateData.businessAdd;
        const billingAdd = updateData.billingAdd;

        const existingAddresses = await db.address.findAll({
            where: { userId: distributorId },
            transaction
        });

        const existingBusiness = existingAddresses.find(addr => addr.addressType === "Business");
        const existingBilling = existingAddresses.find(addr => addr.addressType === "Billing");

        if (existingBusiness) {
            await existingBusiness.update(businessAdd, { transaction });
        } else {
            await db.address.create({
                ...businessAdd,
                userId: distributorId,
                addressType: "Business"
            }, { transaction });
        }

        if (existingBilling) {
            await existingBilling.update(billingAdd, { transaction });
        } else {
            await db.address.create({
                ...billingAdd,
                userId: distributorId,
                addressType: "Billing"
            }, { transaction });
        }

        // ---------------- Document Handling ----------------
        const documents = updateData.documents || [];
        const documentsData = documents.map((doc) => ({
            categoryId: doc.id,
            image: doc.image,
            status: 'Verified',
            imageSize: doc?.imageSize ? formatSize(doc?.imageSize || 0) : "0KB",
            userId: Number(distributorId),
            isDeleted: false
        }));

        await db.documents.bulkCreate(documentsData, {
            updateOnDuplicate: ["image", 'status', 'imageSize', 'isDeleted'],
            conflictFields: ["categoryId", "userId", 'isDeleted'],
            transaction
        });

        await transaction.commit();

        const updatedHospital = await db.hospital.findOne({
            where: { hospitalId },
            attributes: [
                'hospitalName',
                'type',
                'phone',
                'email',
                'address',
                'city',
                'state',
                'GST',
                'license',
                'status',
            ]
        });

        return {
            status: 200,
            message: "Hospital updated successfully",
            updatedHospital,
            billingAdd,
            businessAdd,
            documents: documentsData
        };

    } catch (error) {
        await transaction.rollback();
        console.error("Error in update_Hospital:", error);
        return {
            status: 500,
            message: "Failed to update hospital",
            error: error.message || "Internal Server Error"
        };
    }
};

// exports.getHospitalProfile = async(data) => {
//     try {
//         const { hospitalId } = data;
//         if (!hospitalId) {
//             return {
//                 status: message.code400,
//                 message: "Hospital ID is required",
//             };
//         }

//         const document = await db.documentCategory.findAll({
//             attributes: ['id', 'documentName'],
//             include: [
//                 {
//                     model: db.documents,
//                     as: "documnets",
//                     attributes: ['documentId', 'image', "status", "imageSize", 'updatedAt'],
//                     where: {
//                         isDeleted: { [db.Op.not]: true },
//                         userId: Number(hospitalId)
//                     },
//                     required: false,
//                 },
//             ],
//             where: { category: "Hospital" }
//         });

//         // Raw query to get hospital, user, and address data
//         const query = `
//         SELECT 
//           hs.hospitalName,
//           hs.type,
//           hs.logo,
//           hs.createdAt,
//           hs.updatedAt,
//           hs.address,
//           hs.phone,
//           hs.email,
//           hs.GST as gst,
//           hs.license,
//           hs.city,
//           hs.state,
//           hs.status,
//           hs.hospitalId,
//           us.*,
//           ad.*
//         FROM hospital AS hs
//         LEFT JOIN users AS us ON hs.hospitalId = us.id
//         LEFT JOIN address AS ad ON hs.hospitalId = ad.userId
//         WHERE hs.hospitalId = ${hospitalId};
//       `;

//         const [dataa] = await sequelize.query(query);
//         const transformedData = {};

//         dataa.forEach((row) => {
//             const hospitalId = row.hospitalId;

//             if (!transformedData[hospitalId]) {
//                 transformedData[hospitalId] = {
//                     hospital: {
//                         hospitalName: row.hospitalName,
//                         type: row.type,
//                         logo: row.logo,
//                         address: row.address,
//                         phone: row.phone,
//                         email: row.email,
//                         GST: row.gst,
//                         license: row.license,
//                         city: row.city,
//                         state: row.state,
//                         status: row.status,
//                         createdAt: row.createdAt,
//                         updatedAt: row.updatedAt,
//                         hospitalId: row.hospitalId
//                     },
//                     user: {
//                         id: row.id,
//                         userName: row.userName,
//                         userType: row.userType,
//                         password: row.password,
//                         status: row.status,
//                         deletedAt: row.deletedAt,
//                         isPasswordChangeRequired: row.isPasswordChangeRequired,
//                     },
//                     addresses: {},
//                     documents: {}
//                 };
//             }

//             if (row.addressType) {
//                 transformedData[hospitalId].addresses[row.addressType] = {
//                     addressId: row.addressId,
//                     userId: row.userId,
//                     name: row.name,
//                     email: row.email,
//                     mobile: row.mobile,
//                     webURL: row.webURL,
//                     addLine1: row.addLine1,
//                     addLine2: row.addLine2,
//                     city: row.city,
//                     State: row.State,
//                     country: row.country,
//                     pinCode: row.pinCode,
//                 };
//             }

//             transformedData[hospitalId].documents = document;
//         });

//         return {
//             status: 200,
//             message: message.message200,
//             apiData: Object.values(transformedData),
//         };

//     } catch (error) {
//         console.log("getHospital error:", error.message);
//         return {
//             status: 500,
//             message: message.message500,
//             error: error.message
//         };
//     }
// };
