module.exports =(sequelize,Sequelize)=>{
    const payments = sequelize.define("patients",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "mobile":{
            type: Sequelize.BIGINT,
            allowNull: false,
            unique:true
        },
        "name":{
            type:Sequelize.STRING,
            allowNull:false
        },
        "address":{
            type: Sequelize.STRING,
        },
        "pinCode":{
            type:Sequelize.STRING
        },
        "state":{
            type:Sequelize.STRING
        },
        "disease":{
            type: Sequelize.STRING,
        },
        "diagnoseDate":{
            type:Sequelize.DATE
        },
        "treatmentDate":{
            type:Sequelize.DATE
        },
        "BP":{
            type:Sequelize.STRING
        },
        "DOB":{
            type:Sequelize.DATE
        },
        "guardians":{
            type:Sequelize.STRING
        },
        "IdNo":{
            type:Sequelize.STRING
        },
        "phnNo":{
            type:Sequelize.STRING
        },
        "discount":{
            type:Sequelize.DOUBLE
        },
        "wieght":{
            type:Sequelize.STRING
        },
        "gender":{
            type:Sequelize.ENUM('Male','Female','Other')
        },
        "pulse":{
            type:Sequelize.STRING
        },
        "sugar":{
            type:Sequelize.STRING
        },
        "retailerId":{
            type:Sequelize.INTEGER,
            allowNull: false,
        }
    },

    {
        tableName: "patients"
      })
    return payments
}
