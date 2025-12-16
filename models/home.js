
const mongoose=require('mongoose')


//_id is automatically added by mongoose
const homeSchema=mongoose.Schema({//mongooese.schema function returns schema 
  houseName:{type:String,required:true},
  price:{type:Number,required:true},
  location:{type:String,required:true},
  rating:{type:Number,required:true},
  photo:String,
  description:String,

})



module.exports=mongoose.model('Home',homeSchema)//mongoose is creating model Home and homeschema is structure usind by Home Model
    









