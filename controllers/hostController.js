const Home=require('../models/home')
const fs=require('fs')
/*Whenever you call res.render(), start looking inside /views.*/

exports.getAddHome=(req, res, next) => {
  res.render('host/edit-home', {editing: false,pageTitle: 'Add Home to airbnb', currentPage: 'addHome',isLoggedIn:req.isLoggedIn,userType:req.session.userType}); // Pass userType from session instead of user object
}

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === 'true';

  Home.findById(homeId) //MongoDB shell is flexible. so was using findbyId,but Mongoose is strict as hell and it is case sensitive so findById
  .then((home) => {
    if (!home) {
      console.log("Home not found for editing.");
      return res.redirect("/host/host-homes-list");
    }

    console.log(homeId, editing, home);
    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      editing: editing,
      isLoggedIn:req.isLoggedIn,
      userType:req.session.userType  // Pass userType from session instead of user object
    });
  });
};


exports.getHostHomes=(req, res, next) => {
  Home.find().then((registeredHomes)=>{ // find function is given by mongoose
    res.render('host/host-home-list', {registeredHomes: registeredHomes, pageTitle: 'Host Homes List', currentPage: 'host-homes',isLoggedIn:req.isLoggedIn,userType:req.session.userType}); // Pass userType from session instead of user object /*here right registerdhomes is the variable you are sending to ejs and left is the valus of all homes ,so if you want to change the name change in ejs also like from  registeredHomes to Homes ,so whenever you call find it goes to staatic method find function */
  }); /*Whenever you call res.render(), start looking inside /views.*/
 
}

exports.postAddHome=(req, res, next) => {
  const {houseName,price,location,rating,description}=req.body;
  console.log(houseName,price,location,rating,description)
    console.log(req.file)
 if(!req.file){// if the file is of wrong type as per fileFilter function in app.js , req.file will be undefined
    return res.status(422).send('No image provided ');
 }
const photo=req.file.path; // multer will add the file property to req object which contains info about uploaded file ,path is the location where file is stored
   const home=new Home({houseName,price,location,rating,photo,description}); // i am writing as object bcoz HOME class created by mongose exapects an object 
  home.save().then(()=>{ 
    console.log("Home Saved SuccesFully")
  })
res.redirect('/host/host-homes-list');
} 



exports.postEditHome = (req, res, next) => {
  const { id, houseName, price, location, rating, description } =req.body;
  Home.findById(id).then((home) => { //the data i got i am passing into home which is object ,so using home.housename and all and save it once it edited
    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

if(req.file){//
  fs.unlinkSync(home.photo,err=>{//delete the old image file from uploads folder when new image is uploaded,when editing home details
    if(err){
      console.log("Error while deleting old image file",err)
    } 
  });
   home.photo=req.file.path; // this is bcoz if i edit the home but not change the photo still the old photo should be there ,so only if new file is there update the photo path,can see in mongo also->photo field
  
}

    home.save().then((result) => {
    console.log("Home updated ", result);
    }).catch(err => {
      console.log("Error while updating ", err);
    })
    res.redirect("/host/host-homes-list");
  }).catch(err => {
      console.log("Error while finfing Home ", err);
    })
};



exports.postDeleteHome=(req, res, next) => {
 const homeId=req.params.homeId;
console.log("Came to delete ",homeId)
Home.findByIdAndDelete(homeId)
.then(()=>{
  res.redirect('/host/host-homes-list');
}).catch(error=>{
   console.log("Error while Deleting",error)
})

} 
