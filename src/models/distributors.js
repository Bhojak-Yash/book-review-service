module.exports =(sequelize,Sequelize)=>{
    const distributors = sequelize.define("distributors_new",{
        "distributorId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           // autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "distributorCode":{
            type:Sequelize.STRING,
            allowNull: false
        },
        "companyName":{
            type: Sequelize.STRING,
            allowNull: false
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
        "profilePic": {
            type: Sequelize.STRING
        },
        "email":{
            type:Sequelize.STRING
        },
        "licence": {
            type: Sequelize.STRING
        },   
        "status": {
            type: Sequelize.ENUM(
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
        "PAN":{
            type:Sequelize.STRING
        },
        "GST": {
            type: Sequelize.STRING
        },
        "CIN": {
            type: Sequelize.STRING
        },
        "FSSAI":{
            type:Sequelize.STRING
        },
        "wholeSaleDrugLicence":{
            type:Sequelize.STRING
        },
        // "roleId":{
        //     type:Sequelize.INTEGER
        // },
        "type": {
            type: Sequelize.ENUM('CNF', 'Distributor')
        },
    },

    {
        tableName: "distributors_new"
      })
    return distributors
}

