module.exports =(sequelize,Sequelize)=>{
    const distributors = sequelize.define("distributors",{
        "distributorId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           // autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "distributorCode":{
            type:Sequelize.STRING
        },
        "companyName":{
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
        "profilePic":{
            type:Sequelize.STRING
        },
        "GST":{
            type:Sequelize.STRING
        },
        "type":{
            type:Sequelize.ENUM('CNF','Distributor')
        },
        "PAN":{
            type:Sequelize.STRING
        },
        "FSSAI":{
            type:Sequelize.STRING
        },
        "wholeSaleDrugLicence":{
            type:Sequelize.STRING
        }
    },

    {
        tableName: "distributors"
      })
    return distributors
}

