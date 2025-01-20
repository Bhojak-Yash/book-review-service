const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const {verifyToken} = require('../middlewares/auth')


// Add single product
exports.addEntity = async (req,res) => {
    const {...entityData } = req.body;
  try {

   
    console.log(entityData);
    // Add the new product
    const newEntity = await db.entities.create({
      ...entityData,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    });

    return res.status(201).json({ message: 'Entity added successfully.', Entity: newEntity });
  } catch (error) {
    console.error('Error adding entity:', error);
    return res.status(500).json({ message: 'Failed to add entity.', error: error.message });
  }
};

// Update single product
exports.updateEntity = async (req, res) => {
    const { entityId,organisationId, ...entityData } = req.body;
    try {
      // Check if the product exists
      const existingEntity = await db.entities.findOne({
        where: {
          entityId: entityId,
          organisationId:organisationId,
        },
      });
  
      if (!existingEntity) {
        return res.status(404).json({ message: `Entity with ID '${entityId}' not found.` });
      }
  
      // Update the product
      await db.entities.update(
        {
          ...entityData,
          UpdatedAt: new Date(),
        },
        {
          where: {
          entityId: entityId,
          organisationId: organisationId,
          },
        }
      );
  
      return res.status(200).json({ message: 'Entity updated successfully.' });
    } catch (error) {
      console.error('Error updating entity:', error);
      return res.status(500).json({ message: 'Failed to update Entity.', error: error.message });
    }
};

exports.getEntities = async (req, res) => {
 // console.log(req.params);
 // const { organisationId } = req.params;
 const loggedInUserId = req.user.id;
  try {
    const entities = await db.entities.findAll({
      where: { organisationId: loggedInUserId },
    });

    if (!entities) {
      return res.status(404).json({ message: "Entities not found." });
    }

    return res.status(200).json({ message: "Entities retrieved successfully.", entities });
  } catch (error) {
    console.error("Error fetching Entities details:", error);
    return res.status(500).json({ message: "Failed to retrieve Entities details.", error: error.message });
  }
};