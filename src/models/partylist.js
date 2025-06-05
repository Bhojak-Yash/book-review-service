module.exports =(sequelize,Sequelize)=>{
    const partyList = sequelize.define("partyList",{
        "id":{
            type: Sequelize.BIGINT,
          primaryKey: true, // Mark this as the primary key
          autoIncrement: true, // Automatically increment the ID
          allowNull: false,
        },
        "companyName":{
            type:Sequelize.STRING,
            required:true
        },
        "ownerName":{
            type:Sequelize.STRING
        },
        "profilePic":{
            type:Sequelize.STRING
        },
        "address":{
            type:Sequelize.STRING,
            required:true
        },
        "phone":{
            type:Sequelize.BIGINT,
            required:true
        },
        "FSSAI":{
            type:Sequelize.STRING
        },
        "drugLicense":{
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
        },
        "organisationId":{
            type:Sequelize.BIGINT,
            required:true
        },
        "State":{
            type:Sequelize.STRING
        },
        "city":{
            type:Sequelize.STRING
        }
    },
    {
        tableName: "partyList"
      })
    return partyList
}

