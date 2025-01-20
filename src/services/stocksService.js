const db = require('../models/db');

class StocksService {
  async getAllStocksByManufacturerId(manufacturerId) {
    return await db.stocks.findAll({
      where: { manufacturerId },
    });
  }

  async getStockDetails(PId) {
    return await db.stocks.findAll({
      where: { PId },
    });
  }

  async addStock(manufacturerId, stocksData) {
    return await db.stocks.create({
      ...stocksData,
      manufacturerId,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    });
  }

  async updateStock(SId, manufacturerId, stockData) {
    const existingStock = await db.stocks.findOne({
      where: {
        SId,
        manufacturerId,
      },
    });

    if (!existingStock) {
      throw new Error(`Product with ID '${SId}' not found.`);
    }

    await db.stocks.update(
      {
        ...stockData,
        UpdatedAt: new Date(),
      },
      {
        where: {
          SId,
          manufacturerId,
        },
      }
    );

    return existingStock;
  }

  async getStockDetailsByManufacturer(manufacturerId) {
    return await db.stocks.findAll({
      include: [
        {
          model: db.products,
          as: 'product',
          attributes: ['PId', 'PCode', 'PName'],
        },
      ],
      where: { manufacturerId },
    });
  }
}

module.exports = new StocksService();
