module.exports =(sequelize,Sequelize)=>{
    const items = sequelize.define("loginlogs",{
        "userId":{
            type: Sequelize.STRING,
            allowNull: false
        },
        "token":{
            type:Sequelize.TEXT
        },
        "isExpired":{
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        }
    },

    {
        tableName: "loginlogs", // Map explicitly to the `orderdetails` tabl        // If your table does not have `createdAt` and `updatedAt` columns
      })
    return items
}