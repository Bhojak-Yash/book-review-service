module.exports =(sequelize,Sequelize)=>{
    const payments = sequelize.define("doctors",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "mobile":{
            type: Sequelize.BIGINT,
            allowNull: false,
            // unique:true
        },
        "name":{
            type: Sequelize.STRING,
            allowNull: false
        },
        "address":{
            type:Sequelize.STRING
        },
        "RGNo":{
            type:Sequelize.STRING
        },
        "IDNo":{
            type: Sequelize.STRING
        },
        "phnNo":{
            type:Sequelize.STRING
        },
        "commission":{
            type:Sequelize.DOUBLE
        },
        "speciality":{
            type:Sequelize.STRING
        },
        "qualification":{
            type:Sequelize.STRING
        },
        "retailerId":{
            type:Sequelize.INTEGER,
            allowNull: false,
        }
    },

    {
        tableName: "doctors"
      })
    return payments
}
