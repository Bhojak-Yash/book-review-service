module.exports =(sequelize,Sequelize)=>{
    const products = sequelize.define("products",{
        "PId":{
            type:Sequelize.BIGINT,
            primaryKey: true, // Mark this as the primary key
            autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "PCode":{
            type:Sequelize.STRING
        },
        "PName":{
            type:Sequelize.STRING
        },
        "PackagingDetails":{
            type:Sequelize.STRING
        },
        // "HSN":{
        //     type:Sequelize.STRING
        // },
        // "LOCA":{
        //     type:Sequelize.STRING
        // },
        // "LOCN":{
        //     type:Sequelize.STRING
        // },
        "Package":{
             type:Sequelize.STRING
        },
        "ProductForm":{
             type:Sequelize.STRING
        },
        "SaltComposition":{
             type:Sequelize.STRING
        },
        "Generic":{
            type:Sequelize.STRING
        },
        "PCategory":{
            type:Sequelize.STRING
        },
        "DPCO":{
            type:Sequelize.INTEGER
        },
        "BoxPack":{
            type:Sequelize.INTEGER
        },
        "CasePack":{
            type:Sequelize.INTEGER
        },
        "GSTPer":{
            type:Sequelize.DOUBLE
        },
        "MRP":{
            type:Sequelize.DOUBLE
        },
        "PTR":{
            type:Sequelize.DOUBLE
        },
        "DNick":{
            type:Sequelize.STRING
        },
        "DMfg":{
            type:Sequelize.STRING
        },
        "PNick":{
            type:Sequelize.STRING
        },
        "PMfg":{
            type:Sequelize.STRING
        },
        "LOCKED":{
            type:Sequelize.INTEGER
        },
        "manufacturerId":{
            type:Sequelize.BIGINT
        }
    },
    {
        tableName: "products"
      }
    )
    return products
}
