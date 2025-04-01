module.exports =(sequelize,Sequelize)=>{
    const stocks = sequelize.define("manufacturer_stocks",{
        "SId":{
            type:Sequelize.BIGINT,
            primaryKey: true, // Mark this as the primary key
            autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "PId":{
            type:Sequelize.INTEGER
        },
        "BatchNo":{
            type: Sequelize.STRING,
            allowNull: false
        },
        "ExpDate":{
            type: Sequelize.DATE,
            allowNull: false
        },
        "MRP":{
            type: Sequelize.DOUBLE,
            allowNull: false
        },
        "PTR":{
            type:Sequelize.DOUBLE
        },
        "PTS":{
            type:Sequelize.DOUBLE
        },
        "Scheme":{
            type:Sequelize.STRING
        },
        "BoxQty":{
            type:Sequelize.INTEGER
        },
        "Loose":{
            type:Sequelize.INTEGER
        },
        "Stock":{
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "organisationId":{
            type: Sequelize.BIGINT,
            allowNull: false
        }
        ,
        "entityId":{
            type:Sequelize.BIGINT
        },
        "location":{
            type: Sequelize.STRING,
            // allowNull: false
        },
    },
    {
        tableName: "manufacturer_stocks"
      })
    return stocks
}


// SId int AI PK 
// PID int 
// BatchNo varchar(255) 
// ExpDate date 
// MRP double 
// PTR double 
// Scheme varchar(255) 
// BoxQty int 
// Loose int 
// Stock int 
// entityId int 
// createdAt datetime 
// updatedAt datetime 
// deletedAt datetime 
// organisationId int 
// location varchar(45)