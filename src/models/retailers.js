module.exports =(sequelize,Sequelize)=>{
    const retailers = sequelize.define("retailers",{
        "retailerId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           // autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "retailerCode":{
            type:Sequelize.STRING
        },
        "firmName":{
            type:Sequelize.STRING
        },
        "ownerName":{
            type:Sequelize.STRING
        },
        "address":{
            type:Sequelize.STRING
        },
        "phone":{
            type:Sequelize.BIGINT
        },
        "licence":{
            type:Sequelize.STRING
        },
        "email":{
            type:Sequelize.STRING
        },
        "status":{
            type:Sequelize.ENUM(
                "Active",
                "Inactive"
            )
        }
    },

    {
        tableName: "retailers"
      })
    return retailers
}

