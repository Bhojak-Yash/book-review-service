module.exports =(sequelize,Sequelize)=>{
    const doctorsPayments = sequelize.define("doctorsPayments",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true, 
            autoIncrement: true, 
            allowNull: false
        },
        "amount":{
            type:Sequelize.BIGINT
        },
        "retailerId":{
            type:Sequelize.INTEGER
        },
        "doctorId":{
            type: Sequelize.INTEGER
        },
        "mode":{
            type:Sequelize.ENUM("Cash",'Online','Credit')
        },
        "imageURL":{type:Sequelize.STRING},
        "status":{
            type:Sequelize.ENUM('Pending','Confirmed','Rejected')
        }
    },
    {
        tableName: 'doctorsPayments'
    });
    return doctorsPayments
}