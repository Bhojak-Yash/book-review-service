module.exports =(sequelize,Sequelize)=>{
    const manufacturers = sequelize.define("manufacturers",{
        "manufacturerId":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        "manufacturerCode": {
            type: Sequelize.STRING,
            allowNull: false
        },
        "companyName":{
            type: Sequelize.STRING,
            allowNull: false
        },
        "companyType": {
            type: Sequelize.ENUM(
                "Sole Proprietorship",
                "Partnership Firm",
                "Limited Liability Partnership (LLP)",
                "Private Limited Company",
                "Public Limited Company",
                "One Person Company (OPC)",
                "Section 8 Company",
                "Producer Company",
                "Nidhi Company",
                "Unlimited Company",
                "Other"
            ),
            allowNull: true
        },
        "ownerName":{
            type:Sequelize.STRING
        },
        "logo":{
            type:Sequelize.STRING
        },
        "address":{
            type:Sequelize.STRING
        },
        "phone":{
            type:Sequelize.STRING
        },
        "email":{
            type:Sequelize.STRING
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
        "drugLicense":{
            type:Sequelize.STRING
        },
        "fssaiLicense":{
            type:Sequelize.STRING
        },
        "wholesaleLicense":{
            type:Sequelize.STRING
        },
        "licence":{
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
        tableName: "manufacturers"
      })
    //   await manufacturers.sync({ alter: true });
    return manufacturers
}


