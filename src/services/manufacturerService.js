const db = require('../models/db');

class ManufacturerService {
    constructor(db) {
      this.db = db;
    }
  
    async getAuthorizedDistributors(manufacturerId) {
      // Fetch all authorizations for the given manufacturer
      const authorizations = await this.db.authorizations.findAll({
        where: {
          authorizedBy: manufacturerId,
          status: "Approved", // Only fetch approved authorizations
        },
      });
  
      if (!authorizations || authorizations.length === 0) {
        return [];
      }
  
      // Extract the distributor IDs from the authorizations
      const distributorIds = authorizations.map((auth) => auth.authorizedId);
  
      // Fetch distributor details for the authorized distributors
      const distributors = await this.db.distributors.findAll({
        where: {
          distributorId: {
            [this.db.Sequelize.Op.in]: distributorIds, // Use Sequelize `Op.in` operator
          },
        },
        attributes: [
          "distributorId",
          "distributorCode",
          "companyName",
          "ownerName",
          "address",
          "phone",
          "email",
          "licence",
          "profilePic",
          "GST",
        ], // Only fetch required fields
      });
  
      return distributors;
    }
  }
  
  module.exports = ManufacturerService;
  