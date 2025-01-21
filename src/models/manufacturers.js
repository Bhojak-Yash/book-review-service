module.exports =(sequelize,Sequelize)=>{
    const manufacturers = sequelize.define("manufacturers",{
        "manufacturerId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           // autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "companyName":{
            type:Sequelize.STRING
        },
        "ownerName":{
            type:Sequelize.STRING
        },
        // "ownerName":{
        //     type:Sequelize.STRING
        // },
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
        "GST":{
            type:Sequelize.STRING
        },
        "licence":{
            type:Sequelize.STRING
        }
    },

    {
        tableName: "manufacturers"
      })
    return manufacturers
}
