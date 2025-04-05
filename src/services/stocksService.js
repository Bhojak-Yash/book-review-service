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
    const userData = await db.users.findOne({ where: { id: Number(organisationId) } })
    const tableName = userData?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
    const check = await tableName.findOne({ where: { PId: stocksData.PId, BatchNo: stocksData.BatchNo, organisationId: organisationId, purchasedFrom: stocksData.purchasedFrom } })
    if (check) {
      const updatedStock = Number(check.Stock) + Number(stocksData?.Stock);

      // Update the stock value
      await tableName.update(
        { Stock: updatedStock },
        { where: { PId: stocksData.PId, BatchNo: stocksData.BatchNo, organisationId: organisationId } }
      );

      // Return the updated record
      return {
        ...check.toJSON(), // Convert Sequelize object to plain JSON
        Stock: updatedStock // Update stock in the returned object
      };
    }
    return await tableName.create({
      PId: stocksData.PId,
      BatchNo: stocksData.BatchNo,
      ExpDate: stocksData.ExpDate || null,
      MRP: stocksData.MRP || null,
      PTR: stocksData?.PTR || null,
      PTS: stocksData?.PTS || null,
      Scheme: stocksData?.Scheme || null,
      BoxQty: stocksData?.BoxQty || null,
      Loose: stocksData?.Loose || null,
      Stock: stocksData?.Stock || null,
      location: stocksData?.location || null,
      organisationId: organisationId || null,
      entityId: stocksData?.entityId || null,
      purchasedFrom: stocksData?.purchasedFrom,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    });
  }

  async updateStock(SId, organisationId, stockData) {
    const userData = await db.users.findOne({ where: { id: Number(organisationId) } })
    const tableName = userData?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
    const existingStock = await tableName.findOne({
      where: {
        SId,
        organisationId: organisationId,
      },
    });

    if (!existingStock) {
      throw new Error(`Stock with ID '${SId}' not found.`);
    }

    await tableName.update(
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
    // console.log(data)
    let Page = page || 1;
    let Limit = limit || 10;
    const lowStockDays = Number(process.env.lowStockDays)
    // console.log(nearToExpDate)
    let whereCondition = { organisationId: Number(manufacturerId) };
    if (entityId) {
      whereCondition.entityId = Number(entityId);
    }

    const nearToExpDate = new Date();
    // Handle expiration status filter
    if (expStatus) {
      const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

      // Ensure ExpDate is present (not null)
      whereCondition.ExpDate = { [db.Sequelize.Op.ne]: null };

      if (expStatus === "expired") {
        whereCondition.ExpDate = {
          [db.Sequelize.Op.ne]: null,  // Ensure ExpDate is not null
          [db.Sequelize.Op.lt]: today, // Expired (before today)
        };
      } else if (expStatus === "nearToExp") {
        const nearToExpDate = new Date();
        nearToExpDate.setDate(nearToExpDate.getDate() + Number(lowStockDays));

        whereCondition.ExpDate = {
          [db.Sequelize.Op.ne]: null,  // Ensure ExpDate is not null
          [db.Sequelize.Op.between]: [today, nearToExpDate.toISOString().split("T")[0]],
        }; // Between today and `lowStockDays` from now
      } else if (expStatus === "upToDate") {
        const upToDateThreshold = new Date();
        upToDateThreshold.setDate(upToDateThreshold.getDate() + Number(lowStockDays));

        whereCondition.ExpDate = {
          [db.Sequelize.Op.ne]: null,  // Ensure ExpDate is not null
          [db.Sequelize.Op.gt]: upToDateThreshold.toISOString().split("T")[0], // More than `lowStockDays` from today
        };
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

    const { Sequelize, Op } = db;

    // Step 1: Fetch the total stock sum for each PId
    const stockSums = await db.manufacturerStocks.findAll({
      attributes: [
        "PId",
        [Sequelize.fn("SUM", Sequelize.col("Stock")), "sumOfStocks"],
      ],
      include: [
        {
          model: db.products,
          as: "product",
          // attributes: [],
          where: search
            ? {
              [Op.or]: [
                { PCode: { [Op.like]: `%${search}%` } },
                { PName: { [Op.like]: `%${search}%` } },
                { SaltComposition: { [Op.like]: `%${search}%` } },
              ],
            }
            : undefined,
        },
      ],
      group: ["PId"],
      raw: true,
    });
    // const test = db.products.findAll({
    //   where: search
    //   ? {
    //       [Op.or]: [
    //         { PCode: { [Op.like]: `%${search}%` } },
    //         { PName: { [Op.like]: `%${search}%` } },
    //         { SaltComposition: { [Op.like]: `%${search}%` } },
    //       ],
    //     }
    //   : undefined,
    // })

    // Convert the result into a lookup object
    const stockSumMap = stockSums.reduce((acc, item) => {
      acc[item.PId] = parseFloat(item.sumOfStocks); // Ensure numeric value
      return acc;
    }, {});

    // Step 2: Apply stockStatus filtering
    let filteredPIds = [];

    if (stockStatus) {
      filteredPIds = Object.keys(stockSumMap).filter((PId) => {
        const sum = stockSumMap[PId];

        if (stockStatus === "outOfStock") return sum === 0;
        if (stockStatus === "aboutEmpty") return sum < 90 && sum > 0;
        if (stockStatus === "upToDate") return sum >= 90;

        return true; // Default case if no status matches
      });
    }

    // Step 3: Fetch the paginated stock data
    // const {rows:stocks,count} = await db.stocks.findAndCountAll({
    //   include: [
    //     {
    //       model: db.products,
    //       as: "product",
    //       attributes: [
    //         "PId",
    //         "PCode",
    //         "PName",
    //         "PackagingDetails",
    //         "SaltComposition",
    //         "LOCKED",
    //       ],
    //       where: search
    //         ? {
    //             [Op.or]: [
    //               { PCode: { [Op.like]: `%${search}%` } },
    //               { PName: { [Op.like]: `%${search}%` } },
    //               { SaltComposition: { [Op.like]: `%${search}%` } },
    //             ],
    //           }
    //         : undefined,
    //     },
    //   ],
    //   where: {
    //     ...whereCondition,
    //     ...(filteredPIds.length > 0 && { PId: { [Op.in]: filteredPIds } }), // Apply stockStatus filter
    //   },
    //   offset: skip,
    //   limit: Number(Limit),
    //   raw: true,
    //   nest: true,
    // })
    // console.log(whereCondition)
    const { rows: stocks, count } = await db.products.findAndCountAll({
      attributes: [
        "PId",
        "PCode",
        "PName",
        "PackagingDetails",
        "SaltComposition",
        "LOCKED",
        "manufacturerId"
      ],
      include: [
        {
          model: db.manufacturerStocks,
          as: "stockss", // Adjust alias as per your association
          required: false, // LEFT JOIN: include products even if stock is not available
          where: whereCondition
        },
      ],
      where: {
        manufacturerId: manufacturerId,
        ...(search
          ? {
            [Op.or]: [
              { PCode: { [Op.like]: `%${search}%` } },
              { PName: { [Op.like]: `%${search}%` } },
              { SaltComposition: { [Op.like]: `%${search}%` } },
            ],
          }
          : {}),
      },
      offset: skip,
      limit: Number(Limit),
      subQuery: false,
      // raw: true,
      // nest: true,
    })

    const transformedStocks = stocks.flatMap(product => {
      const filteredStocks = expStatus
        ? product.stockss.filter(stock => stock.Stock > 0) // Only include stocks with available quantity
        : product.stockss;

      return filteredStocks.length > 0
        ? filteredStocks.map(stock => ({
          SId: stock.SId,
          PId: stock.PId,
          BatchNo: stock.BatchNo,
          ExpDate: stock.ExpDate,
          MRP: stock.MRP,
          PTR: stock.PTR,
          Scheme: stock.Scheme,
          BoxQty: stock.BoxQty,
          Loose: stock.Loose,
          Stock: stock.Stock,
          organisationId: stock.organisationId,
          entityId: stock.entityId,
          location: stock.location,
          PTS: stock.PTS,
          createdAt: stock.createdAt,
          updatedAt: stock.updatedAt,
          product: {
            PId: product.PId,
            PCode: product.PCode,
            PName: product.PName,
            PackagingDetails: product.PackagingDetails,
            SaltComposition: product.SaltComposition,
            LOCKED: product.LOCKED
          }
        }))
        : (expStatus ? [] : [{ // If expStatus exists and no stock is found, return an empty array
          SId: null,
          PId: null,
          BatchNo: null,
          ExpDate: null,
          MRP: null,
          PTR: null,
          Scheme: null,
          BoxQty: null,
          Loose: null,
          Stock: null,
          organisationId: null,
          entityId: null,
          location: null,
          PTS: null,
          createdAt: null,
          updatedAt: null,
          product: {
            PId: product.PId,
            PCode: product.PCode,
            PName: product.PName,
            PackagingDetails: product.PackagingDetails,
            SaltComposition: product.SaltComposition,
            LOCKED: product.LOCKED
          }
        }]);
    });


    // console.log(transformedStocks);


    // console.log(transformedStocks);


    // return {transformedStocks,count}
    // Step 4: Attach sumOfStocks to each stock object
    const enrichedStocks = transformedStocks.map((stock) => ({
      ...stock,
      sumOfStocks: stockSumMap[stock.product.PId] || 0,
    }));

    // console.log(enrichedStocks);


    const result = count
    const totalData = result;
    const totalPage = Math.ceil(result / Number(Limit));
    const currentPage = Page;
    // stocks = stocks.map((item) => item.toJSON());
    const updatedStocks = await enrichedStocks.map((item) => {
      const expDate = new Date(item.ExpDate);
      const today = new Date();

      // Calculate the difference in days
      const diffDays = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

      let expStatus;
      if (diffDays < 0) {
        expStatus = "expired";
      } else if (diffDays <= nearToExpDate) {
        expStatus = "nearToExp";
      } else {
        expStatus = "upToDate";
      }

      return { ...item, expStatus };
    });

    // console.log(updatedStocks);
    // console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,", updatedStocks);
    console.log("Stock Sum Map:", stockSumMap);
    console.log("Filtered PIds:", filteredPIds);
    console.log("Transformed Stocks Before Filtering:", transformedStocks);
    console.log("Filtered Stocks (expStatus):", transformedStocks.filter(s => s.Stock > 0));


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

      const results = await db.manufacturerStocks.findOne({
        attributes: [
          [db.sequelize.fn("COUNT", db.sequelize.literal('CASE WHEN Stock <= 0 THEN 1 ELSE NULL END')), "outOfStock"],

          [db.sequelize.fn("COUNT", db.sequelize.literal(`CASE WHEN Stock > 0 AND Stock < ${aboutToEmpty} THEN 1 ELSE NULL END`)), "lowStockAlert"],

          [db.sequelize.fn("COUNT", db.sequelize.literal(`CASE WHEN ExpDate < '${today}' THEN 1 ELSE NULL END`)), "expiredStock"],

          [db.sequelize.fn("MAX", db.sequelize.col("updatedAt")), "lastUpdated"]
        ],
        where: { organisationId: Number(manufacturerId) },
        raw: true,
      });



      return {
        ...result, ...results
      }
    } catch (error) {
      console.log('getManufacturerStockSummary error:', error.message)
      return {
        status: 500,
        message: error.message
      }
    }
  }

  async getAllStocks(data) {
    try {
      const { id, entityId, page, limit, expStatus, search, stockStatus } = data;
      // console.log(data)
      const userData = await db.users.findOne({ where: { id: Number(id) } })
      const tableName = userData?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
      let Page = page || 1;
      let Limit = limit || 10;
      const nearToExpDate = Number(process.env.lowStockDays)
      // console.log(nearToExpDate)
      let whereCondition = { organisationId: Number(id) };
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

      const { Sequelize, Op } = db;

      // Step 1: Fetch the total stock sum for each PId
      const stockSums = await tableName.findAll({
        attributes: [
          "PId",
          [Sequelize.fn("SUM", Sequelize.col("Stock")), "sumOfStocks"],
        ],
        include: [
          {
            model: db.products,
            as: "product",
            attributes: [],
            // where: search
            //   ? {
            //       [Op.or]: [
            //         { PCode: { [Op.like]: `%${search}%` } },
            //         { PName: { [Op.like]: `%${search}%` } },
            //         { SaltComposition: { [Op.like]: `%${search}%` } },
            //       ],
            //     }
            //   : undefined,
          },
        ],
        group: ["PId"],
        raw: true,
      });

      // Convert the result into a lookup object
      const stockSumMap = stockSums.reduce((acc, item) => {
        acc[item.PId] = parseFloat(item.sumOfStocks); // Ensure numeric value
        return acc;
      }, {});

      // Step 2: Apply stockStatus filtering
      let filteredPIds = [];

      if (stockStatus) {
        filteredPIds = Object.keys(stockSumMap).filter((PId) => {
          const sum = stockSumMap[PId];

          if (stockStatus === "outOfStock") return sum === 0;
          if (stockStatus === "aboutEmpty") return sum < 90 && sum > 0;
          if (stockStatus === "upToDate") return sum >= 90;

          return true; // Default case if no status matches
        });
      }

      // Step 3: Fetch the paginated stock data
      const { rows: stocks, count } = await db.products.findAndCountAll({
        attributes: [
          "PId",
          "PCode",
          "PName",
          "PackagingDetails",
          "SaltComposition",
          "LOCKED",
          "manufacturerId"
        ],
        include: [
          {
            model: db.stocks,
            as: "stocks", // Adjust alias as per your association
            required: false, // LEFT JOIN: include products even if stock is not available
            where: whereCondition
          },
        ],
        where: {
          manufacturerId: id,
          ...(search
            ? {
              [Op.or]: [
                { PCode: { [Op.like]: `%${search}%` } },
                { PName: { [Op.like]: `%${search}%` } },
                { SaltComposition: { [Op.like]: `%${search}%` } },
              ],
            }
            : {}),
        },
        offset: skip,
        limit: Number(Limit),
        subQuery: false,
        // raw: true,
        // nest: true,
      })

      const transformedStocks = stocks.flatMap(product => {
        const filteredStocks = expStatus
          ? product.stocks.filter(stock => stock.Stock > 0) // Only include stocks with available quantity
          : product.stocks;

        return filteredStocks.length > 0
          ? filteredStocks.map(stock => ({
            SId: stock.SId,
            PId: stock.PId,
            BatchNo: stock.BatchNo,
            ExpDate: stock.ExpDate,
            MRP: stock.MRP,
            PTR: stock.PTR,
            Scheme: stock.Scheme,
            BoxQty: stock.BoxQty,
            Loose: stock.Loose,
            Stock: stock.Stock,
            organisationId: stock.organisationId,
            entityId: stock.entityId,
            location: stock.location,
            PTS: stock.PTS,
            createdAt: stock.createdAt,
            updatedAt: stock.updatedAt,
            product: {
              PId: product.PId,
              PCode: product.PCode,
              PName: product.PName,
              PackagingDetails: product.PackagingDetails,
              SaltComposition: product.SaltComposition,
              LOCKED: product.LOCKED
            }
          }))
          : (expStatus ? [] : [{ // If expStatus exists and no stock is found, return an empty array
            SId: null,
            PId: null,
            BatchNo: null,
            ExpDate: null,
            MRP: null,
            PTR: null,
            Scheme: null,
            BoxQty: null,
            Loose: null,
            Stock: null,
            organisationId: null,
            entityId: null,
            location: null,
            PTS: null,
            createdAt: null,
            updatedAt: null,
            product: {
              PId: product.PId,
              PCode: product.PCode,
              PName: product.PName,
              PackagingDetails: product.PackagingDetails,
              SaltComposition: product.SaltComposition,
              LOCKED: product.LOCKED
            }
          }]);
      });

      // Step 4: Attach sumOfStocks to each stock object
      const enrichedStocks = transformedStocks.map((stock) => ({
        ...stock,
        sumOfStocks: stockSumMap[stock.product.PId] || 0,
      }));

      // console.log(enrichedStocks);


      const result = count
      const totalData = result;
      const totalPage = Math.ceil(result / Number(Limit));
      const currentPage = Page;
      // stocks = stocks.map((item) => item.toJSON());
      const updatedStocks = await enrichedStocks.map((item) => {
        const expDate = new Date(item.ExpDate);
        const today = new Date();

        // Calculate the difference in days
        const diffDays = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

        let expStatus;
        if (diffDays < 0) {
          expStatus = "expired";
        } else if (diffDays <= nearToExpDate) {
          expStatus = "nearToExp";
        } else {
          expStatus = "upToDate";
        }

        return { ...item, expStatus };
      });

      // console.log(updatedStocks);

      return {
        stocks: updatedStocks, totalData, totalPage, currentPage: Number(currentPage)
      }
    } catch (error) {
      console.log(' getAllStocks service error:', error.message)
      return {
        status: 500,
        message: error.message
      }
    }
  }

}

module.exports = new StocksService();
