// Core Module
const path = require('path');

// External Module
const express = require('express');
const multer=require('multer');//for file upload
const session=require('express-session')
const { default:mongoose }=require('mongoose')
const MongoDBStore=require('connect-mongodb-session')(session)
const DB_PATH="mongodb+srv://root:Appaamma%40123@cluster0.ai8ngnf.mongodb.net/airbnb?retryWrites=true&w=majority"

//Local Module
const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const authRouter=require("./routes/authRouter")
const rootDir = require("./utils/pathUtil");
const errorController=require('./controllers/errors');



// db.execute('SELECT*FROM homes')//->here db.execute returns promise 
// .then(([rows,fields])=>{//->Array Destructuring
//   console.log("Getting From DB",rows)
// })
// .catch(error=>{
//   console.log('Eroor While reading Home records',error)
// })

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const store=new MongoDBStore({
  uri:DB_PATH,
  collection:'sessions'
})

const randomString=(length)=>{
  const characters='abcdefghijklmnopqrstuvwxyz0123456789';
  let result='';
  for(let i=0;i<length;i++){
    result+=characters.charAt(Math.floor(Math.random()*characters.length));
  }
  return result;
}


const storage= multer.diskStorage({
    destination:(req,file,cb)=>{
      cb(null,"uploads/")// the folder where photo files will be stored
    },
    filename:(req,file,cb)=>{
      cb(null, randomString(10) +'-'+ file.originalname)
    }
  })
  
  const fileFilter=(req,file,cb)=>{ 
    if(file.mimetype==='image/jpg' || file.mimetype==='image/png' || file.mimetype==='image/jpeg'){
      cb(null,true)//accept file
    }else{
      cb(null,false)//reject file
    }
  }



const multeroptions={
   storage,fileFilter// this storage is coming from const storage above,
}
app.use(express.static(path.join(rootDir, 'public')))
app.use(express.urlencoded());
app.use(multer(multeroptions).single('photo'));//this is for parsing multipart/form-data ,single->for single file upload and 'photo' is the name of the input field in the form where user selects the file to upload

app.use("/uploads",express.static(path.join(rootDir,'uploads')))//making uploads folder public so that images can be accessed directly from browser
app.use("/host/uploads",express.static(path.join(rootDir,'uploads')))//this is bcoz in host/edit-home.ejs i am using /host/uploads/.. to show image so need to make this also static
app.use("/homes/uploads",express.static(path.join(rootDir,'uploads')))//this is bcoz in store/home-details.ejs i am using /homes/uploads/.. to show image so need to make this also static

app.use(session({ //this here is storing in memory so if i changed any word in the code, server starts everytime and session kills everytime and i need to login everytime , so i need to store in mongo-> so storing in db in above page ->MongoDBStore
  secret:"root1",
  resave:false,//If user did nothing, don't save session again
  saveUninitialized:true,//Even first-time empty visitor, give them a session cookie
  store:store//this store is related to MongoDBStore ->check Above in the code 
}))



app.use((req,res,next)=>{
req.isLoggedIn=req.session.isLoggedIn;
next()
})
app.use(authRouter);
app.use(storeRouter);
app.use("/host", (req,res,next)=>{//this is bcoz sometimes if anyone remembers path they can acess path by entering the path directly,but that also is denied and redirected to login page to login first ,Any route that starts with /host is protected,ex-/host/host-homes-list,/host/add-home
  if(req.isLoggedIn){//authentication guard.
    next()//  // allow request → go to host routes
  }else{
    res.redirect("/login") // block access → send to login page
  }
});
app.use("/host", hostRouter);



app.use(errorController.pageNotFound)


const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to Mongo");

    app.listen(PORT, () => {
      console.log(`Server running on address http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.log("Error While Connecting to Mongoose", err);
  });
