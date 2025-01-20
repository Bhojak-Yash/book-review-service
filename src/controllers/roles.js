const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const {verifyToken} = require('../middlewares/auth')
const Op = db.Op;

exports.getRoles = async (req, res) => {
    console.log(req.params);
    const { ownerId } = req.params;
  
    try {
        const roles = await db.roles.findAll({
            where: {
              [Op.or]: [
                { ownerId: ownerId },
                { ownerId: null }
              ]
            }
          });
          
  
      if (!roles) {
        return res.status(404).json({ message: "roles not found." });
      }
  
      return res.status(200).json({ message: "role details retrieved successfully.", roles });
    } catch (error) {
      console.error("Error fetching roles details:", error);
      return res.status(500).json({ message: "Failed to retrieve roles details.", error: error.message });
    }
  };