const db = require('../models/db');
const dotenv = require('dotenv')
dotenv.config()

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

  async addStock(organisationId, stocksData) {
    // console.log(stocksData,'gfhjkl',organisationId)
    return await db.stocks.create({
      PId: stocksData.PId,
      BatchNo: stocksData.BatchNo,
      ExpDate: stocksData.ExpDate,
      MRP: stocksData.MRP,
      PTR: stocksData.PTR,
      Scheme: stocksData.Scheme,
      BoxQty: stocksData.BoxQty,
      Loose: stocksData.Loose,
      Stock: stocksData.Stock,
      location: stocksData.location,
      organisationId: organisationId,
      entityId: stocksData.entityId || null,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    });
  }

  async updateStock(SId, organisationId, stockData) {
    const existingStock = await db.stocks.findOne({
      where: {
        SId,
        organisationId: organisationId,
      },
    });

    if (!existingStock) {
      throw new Error(`Stock with ID '${SId}' not found.`);
    }

    await db.stocks.update(
      {
        ...stockData,
        UpdatedAt: new Date(),
      },
      {
        where: {
          SId,
          organisationId,
        },
      }
    );

    return existingStock;
  }

  async getStockDetailsByManufacturer(data) {
    const { manufacturerId, entityId, page, limit, expStatus, search, stockStatus } = data;

    let Page = page || 1;
    let Limit = limit || 10;
    const nearToExpDate = Number(process.env.lowStockDays)
    // console.log(nearToExpDate)
    let whereCondition = { organisationId: Number(manufacturerId) };
    if (entityId) {
      whereCondition.entityId = Number(entityId);
    }

    // Handle expiration status filter
    if (expStatus) {
      const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

      if (expStatus === "expired") {
        whereCondition.ExpDate = { [db.Sequelize.Op.lt]: today }; // Expired (before today)
      } else if (expStatus === "nearToExp") {
        const nearToExpDate = new Date();
        nearToExpDate.setDate(nearToExpDate.getDate() + nearToExpDate);
        whereCondition.ExpDate = {
          [db.Sequelize.Op.between]: [today, nearToExpDate.toISOString().split("T")[0]],
        }; // Between today and 90 days from now
      } else if (expStatus === "upToDate") {
        const upToDateThreshold = new Date();
        upToDateThreshold.setDate(upToDateThreshold.getDate() + Number(nearToExpDate));
        whereCondition.ExpDate = { [db.Sequelize.Op.gt]: upToDateThreshold.toISOString().split("T")[0] }; // More than 90 days from today
      }
    }

    let skip = (Page - 1) * Number(Limit);

    // let stocks = await db.stocks.findAll({
    //   include: [
    //     {
    //       model: db.products,
    //       as: "product",
    //       attributes: ["PId", "PCode", "PName", "PackagingDetails", "SaltComposition", "LOCKED"],
    //       where: search
    //                 ? {
    //                     [db.Sequelize.Op.or]: [
    //                         { PCode: { [db.Sequelize.Op.like]: `%${search}%` } },
    //                         { PName: { [db.Sequelize.Op.like]: `%${search}%` } },
    //                         { SaltComposition: { [db.Sequelize.Op.like]: `%${search}%` } },
    //                     ],
    //                 }
    //                 : undefined,
    //     },
    //   ],
    //   where: whereCondition,
    //   offset: skip,
    //   limit: Number(Limit),
    // })

    let stocks = await db.stocks.findAll({
      attributes: [
          "SId", "PId", "BatchNo", "ExpDate", "MRP", "PTR", "Scheme", 
          "BoxQty", "Loose", "Stock", "organisationId", "entityId", 
          "location", "createdAt", "updatedAt",
          [db.Sequelize.fn("SUM", db.Sequelize.col("Stock")), "stockCount"], // Sum Stock per PCode
      ],
      include: [
          {
              model: db.products,
              as: "product",
              attributes: ["PId", "PCode", "PName", "PackagingDetails", "SaltComposition", "LOCKED"], // Product details
              where: search
                  ? {
                      [db.Sequelize.Op.or]: [
                          { PCode: { [db.Sequelize.Op.like]: `%${search}%` } },
                          { PName: { [db.Sequelize.Op.like]: `%${search}%` } },
                          { SaltComposition: { [db.Sequelize.Op.like]: `%${search}%` } },
                      ],
                  }
                  : undefined,
          },
      ],
      where: whereCondition,
      group: ["product.PCode", "stocks.SId"], // Grouping by PCode and Stock ID
      offset: skip,
      limit: Number(Limit),
      raw: true, // Returns plain JSON
  });
  
    const result = stocks.length
    const totalData = result;
    const totalPage = Math.ceil(result / Number(Limit));
    const currentPage = Page;
    // stocks = stocks.map((item) => item.toJSON());
    const updatedStocks = await stocks.map((item) => {
      const expDate = new Date(item.ExpDate);
      const today = new Date();

      // Calculate the difference in days
      const diffDays = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

      let expStatus;
      if (diffDays < 0) {
        expStatus = "expired"; // If the date is before today
      } else if (diffDays <= nearToExpDate) {
        expStatus = "nearToExp"; // If within 90 days from today
      } else {
        expStatus = "upToDate"; // If more than 90 days away
      }

      return { ...item, expStatus };
    });

    // console.log(updatedStocks);

    return {
      stocks: updatedStocks, totalData, totalPage, currentPage: Number(currentPage)
    }
  }

  async getManufacturerStockSummary(data) {
    try {
      const { manufacturerId } = data
      const aboutToEmpty = Number(process.env.aboutToEmpty)
      const nearToExpDate = Number(process.env.lowStockDays)
      let whereCondition = { manufacturerId: Number(manufacturerId) };
      const result = await db.products.findOne({
        attributes: [
          [db.sequelize.fn("COUNT", db.sequelize.col("PId")), "totalProducts"],
          [
            db.sequelize.fn(
              "SUM",
              db.sequelize.literal("CASE WHEN LOCKED = false THEN 1 ELSE 0 END")
            ),
            "unlockedProducts"
          ]
        ],
        where: whereCondition,
        raw: true
      })
      const today = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format

      const results = await db.stocks.findOne({
        attributes: [
          [db.sequelize.fn("COUNT", db.sequelize.literal('CASE WHEN Stock <= 0 THEN 1 ELSE NULL END')), "outOfStock"],

          [db.sequelize.fn("COUNT", db.sequelize.literal(`CASE WHEN Stock > 0 AND Stock < ${aboutToEmpty} THEN 1 ELSE NULL END`)), "lowStockAlert"],

          [db.sequelize.fn("COUNT", db.sequelize.literal(`CASE WHEN ExpDate < '${today}' THEN 1 ELSE NULL END`)), "expiredStock"],

          [db.sequelize.fn("MAX", db.sequelize.col("updatedAt")), "lastUpdated"]
        ],
        where:{organisationId:Number(manufacturerId)},
        raw: true,
      });



      return {
        ...result,...results
      }
    } catch (error) {
      console.log('getManufacturerStockSummary error:', error.message)
      return {
        status: 500,
        message: error.message
      }
    }
  }

}

module.exports = new StocksService();
