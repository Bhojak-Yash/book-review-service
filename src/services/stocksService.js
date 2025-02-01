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
   const { manufacturerId,entityId,page,limit,expStatus }=data

   let Page = page || 1
   let Limit = limit || 10

    let whereCondition = { organisationId: Number(manufacturerId) }
    if (entityId) {
      whereCondition.entityId = Number(entityId)
    }
    if(expStatus){
      
    }
    let skip = 0
    if (Page > 1) {
      skip = Number(Limit) * Number(Page - 1)
    }
    // const result = await db.products.findOne({
    //   attributes: [
    //     [db.sequelize.fn("COUNT", db.sequelize.col("PId")), "totalProducts"],
    //     [
    //       db.sequelize.fn(
    //         "SUM",
    //         db.sequelize.literal("CASE WHEN LOCKED = false THEN 1 ELSE 0 END")
    //       ),
    //       "unlockedProducts"
    //     ]
    //   ],
    //   // where: whereCondition,
    //   raw: true
    // })
    const result = await db.stocks.count({where:whereCondition})
    console.log(result)
    const totalData = result
    const totalPage = Math.ceil(result/Number(Limit))
    const currentPage = Page

    let stocks = await db.stocks.findAll({
      include: [
        {
          model: db.products,
          as: 'product',
          attributes: ['PId', 'PCode', 'PName', 'PackagingDetails', 'SaltComposition', 'LOCKED'],
        },
      ],
      where: whereCondition,
      offset: skip,
      limit: Number(Limit),
    });

    stocks = stocks.map(item => item.toJSON());

    const updatedStocks = await stocks.map((item) => {
      const expDate = new Date(item.ExpDate);
      const today = new Date();

      // Calculate the difference in days
      const diffDays = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

      let expStatus;
      if (diffDays < 0) {
        expStatus = "expired"; // If the date is before today
      } else if (diffDays <= 90) {
        expStatus = "nearToExp"; // If within 90 days from today
      } else {
        expStatus = "upToDate"; // If more than 90 days away
      }

      return { ...item, expStatus };
    });

    // console.log(updatedStocks);

    return {
      stocks:updatedStocks,totalData,totalPage,currentPage:Number(currentPage)
    }
  }
}

module.exports = new StocksService();
