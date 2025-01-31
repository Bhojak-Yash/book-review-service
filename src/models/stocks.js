module.exports =(sequelize,Sequelize)=>{
    const stocks = sequelize.define("stocks",{
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
            type:Sequelize.STRING
        },
        "ExpDate":{
            type:Sequelize.DATE
        },
        "MRP":{
            type:Sequelize.DOUBLE
        },
        "PTR":{
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
            type:Sequelize.INTEGER
        },
        "organisationId":{
            type:Sequelize.BIGINT
        }
        ,
        "entityId":{
            type:Sequelize.BIGINT
        },
        "location":{
            type:Sequelize.STRING
        }
    },
    {
        tableName: "stocks"
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