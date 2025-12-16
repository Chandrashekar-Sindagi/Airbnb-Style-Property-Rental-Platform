
const mongoose=require('mongoose')


//_id is automatically added by mongoose
const userSchema=mongoose.Schema({//mongooese.schema function returns schema 
 firstName:{
  type:String,
  required:[true,'First Name is required']
},
  lastName:String,
  email:{
    type:String,
    required:[true,'Email is required'],
    unique:true
  },
  password:{
    type:String,
    required:[true,'Password is required']
  },
  userType:{
    type:String,
    enum:['guest','host'],
    default:'guest'
  },
  favourites:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Home'
  }] //this is array of object ids and each object id is refering to Home model
})

module.exports=mongoose.model('User',userSchema)//mongoose is creating model Home and homeschema is structure using by Home Model
    









