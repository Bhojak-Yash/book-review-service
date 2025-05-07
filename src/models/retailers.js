module.exports =(sequelize,Sequelize)=>{
    const retailers = sequelize.define("retailers",{
        "retailerId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           // autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "retailerCode":{
            type: Sequelize.STRING,
            allowNull: false
        },
        "firmName":{
            type:Sequelize.STRING
        },
        "ownerName":{
            type:Sequelize.STRING
        },
        "profilePic":{
            type:Sequelize.STRING
        },
        "address":{
            type:Sequelize.STRING
        },
        "phone":{
            type:Sequelize.BIGINT
        },
        "FSSAI":{
            type:Sequelize.STRING
        },
        "drugLicense":{
            type:Sequelize.STRING
        },
        // "licence":{
        //     type:Sequelize.STRING
        // },
        "email":{
            type:Sequelize.STRING
        },
        "status":{
            type:Sequelize.ENUM(
                "Active",
                "Inactive"
            )
        },
        "empMin": {
            type: Sequelize.INTEGER
        },
        "empMax": {
            type: Sequelize.INTEGER
        },
        "retailerscol": {
            type: Sequelize.INTEGER
        },

        "companyType":{
            type: Sequelize.ENUM('Sole Proprietorship', 'Partnership Firm', 'Limited Liability Partnership (LLP)', 'Private Limited Company', 'Public Limited Company', 'One Person Company (OPC)', 'Section 8 Company', 'Producer Company', 'Nidhi Company', 'Unlimited Company', 'Other'),
            // allowNull: false
        },
        "PAN":{
            type:Sequelize.STRING
        },
        "GST":{
            type:Sequelize.STRING
        },
        "CIN":{
            type:Sequelize.STRING
        },
        "accountNumber":{
            type:Sequelize.BIGINT
        },
        "AccHolderName":{
            type:Sequelize.STRING
        },
        "IFSC":{
            type:Sequelize.STRING
        }
    },
    {
        tableName: "retailers"
      })
    return retailers
}

