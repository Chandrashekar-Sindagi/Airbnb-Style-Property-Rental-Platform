
const Home=require('../models/home')
const User=require('../models/user')
const Favourite=require('../models/favourite')  // Import Favourite model to use in getFavouriteList
/*Whenever you call res.render(), start looking inside /views.*/

exports.getIndex=(req, res, next) => {
  console.log("Session Value :",req.session)
  Home.find().then(registeredHomes=>{
 res.render('store/index', {registeredHomes: registeredHomes, pageTitle: 'airbnb Home', currentPage: 'index',isLoggedIn:req.isLoggedIn,userType:req.session.userType}); // Pass userType from session instead of user object
  })//"When the Promise is done, THEN run this code"
}

exports.getHomes=(req, res, next) => {
  Home.find().then(registeredHomes=>{
    res.render('store/home-list', {registeredHomes: registeredHomes, pageTitle: 'Homes List', currentPage: 'Home',isLoggedIn:req.isLoggedIn,userType:req.session.userType}); // Pass userType from session instead of user object /*here left registerdhomes is the variable you are sending to ejs and right is the values of all homes the one you are passing as parameter in function abve  ,so if you want to change the name change in ejs also like from  registeredHomes to Homes ,so whenever you call find it goes to staatic method find function */
  }); 
 
}

exports.getBookings=(req, res, next) => {
    res.render('store/bookings', { pageTitle: 'My Bookings', currentPage: 'bookings',isLoggedIn:req.isLoggedIn,userType:req.session.userType}); // Pass userType from session instead of user object
} 

exports.getFavouriteList = async (req, res, next) => {
  try {
    // Use userId from session (stored as string) instead of req.session.user._id
    const userId = req.session.userId;
    
    // Find all favourites for this user and populate the houseId with actual home details
    const favourites = await Favourite.find({ userId: userId }).populate('houseId');  // populate will replace ids with actual objects
    const favouriteHomes = favourites.map(fav => fav.houseId).filter(home => home !== null);  // Extract home objects and filter out null values
    
    res.render("store/favourite-list", {
      favouriteHomes: favouriteHomes,  // Pass array of home objects
      pageTitle: "My Favourites", 
      currentPage: "favourites",
      isLoggedIn: req.isLoggedIn,
      userType: req.session.userType  // Pass userType from session instead of user object
    });
  } catch (err) {
    // Handle any errors during favourite retrieval
    console.log("Error fetching favourites:", err);
    res.status(500).render("store/favourite-list", {
      favouriteHomes: [],
      pageTitle: "My Favourites", 
      currentPage: "favourites",
      isLoggedIn: req.isLoggedIn,
      userType: req.session.userType
    });
  }
};

exports.postAddToFavourite = async (req, res, next) => {
  try {
    const homeId = req.body.id;  // home id is from request body (sent from frontend)
    const userId = req.session.userId;  // user id is from session (stored as string)
    
    // Check if this favourite already exists
    const existingFavourite = await Favourite.findOne({ userId: userId, houseId: homeId });
    
    if (!existingFavourite) {
      // Create new favourite record linking user and home
      const favourite = new Favourite({
        userId: userId,
        houseId: homeId
      });
      await favourite.save();  // Save to Favourite collection
      console.log("Favourite Added", favourite);
    } else {
      console.log("Already Marked As favourite");
    }
    
    res.redirect('/favourites');
  } catch (err) {
    console.log("Error while adding favourite:", err);
    res.redirect('/favourites');
  }
};

  


exports.postRemoveFromFavourite = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;  // home id is from url parameters
    const userId = req.session.userId;  // user id is from session (stored as string)
    
    // Find and delete the favourite record for this user and home
    const result = await Favourite.findOneAndDelete({ userId: userId, houseId: homeId });
    
    if (result) {
      console.log("Favourite Removed", result);
    } else {
      console.log("Favourite not found");
    }
    
    res.redirect('/favourites');
  } catch (err) {
    console.log("Error while removing favourite:", err);
    res.redirect('/favourites');
  }
};


exports.getHomesDetails = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findById(homeId)
    .then((home) => {
  
      if (!home) {
        console.log("Home Not Found");
        return res.redirect("/homes");
      }

      res.render("store/home-detail", {
        home: home,
        pageTitle: "Home Details",
        currentPage: "Home",
        isLoggedIn:req.isLoggedIn,
        userType:req.session.userType  // Pass userType from session instead of user object
      });
    })
    .catch(err => console.log(err));
};
