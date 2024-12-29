const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const {verifyToken} = require('../middlewares/auth')


// Add single product
exports.addDivision = async (req,res) => {
    const {...divisionData } = req.body;
  try {

    console.log("wtereyrtuierytiueyuieyitueytiueyiueytiue");
    console.log(divisionData);
    // Add the new product
    const newDivision = await db.divisions.create({
      ...divisionData,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    });

    return res.status(201).json({ message: 'Division added successfully.', Division: newDivision });
  } catch (error) {
    console.error('Error adding division:', error);
    return res.status(500).json({ message: 'Failed to add division.', error: error.message });
  }
};

// Update single product
exports.updateDivision = async (req, res) => {
    const { divisionId,divisionOf, ...divisionData } = req.body;
    try {
      // Check if the product exists
      const existingDivision = await db.divisions.findOne({
        where: {
          divisionId: divisionId,
          divisionOf:divisionOf,
        },
      });
  
      if (!existingDivision) {
        return res.status(404).json({ message: `Division with ID '${divisionId}' not found.` });
      }
  
      // Update the product
      await db.divisions.update(
        {
          ...divisionData,
          UpdatedAt: new Date(),
        },
        {
          where: {
          divisionId: divisionId,
          divisionOf: divisionOf,
          },
        }
      );
  
      return res.status(200).json({ message: 'Division updated successfully.' });
    } catch (error) {
      console.error('Error updating division:', error);
      return res.status(500).json({ message: 'Failed to update division.', error: error.message });
    }
};