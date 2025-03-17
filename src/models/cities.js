module.exports =(sequelize,Sequelize)=>{
    const cities = sequelize.define("cities",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true, 
            autoIncrement: true, 
            allowNull: false
        },
        "city":{
            type:Sequelize.STRING
        },
        "state_id":{
            type: Sequelize.INTEGER
        }
    },
    {
        timestamps: false
    });
    return cities
}