var express = require('express');
const passport = require('passport');
var router = express.Router();
const fs = require("fs")
var localStrategy = require("passport-local")
var userModel = require("./users")
const postModel = require("./post")
passport.use(new localStrategy(userModel.authenticate()))
const upload = require("./multer")
router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/feed',isLoggedIn,async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user})
  const posts = await postModel.find().populate("user")
  res.render('feed', {footer: true, posts,user});
});

router.get('/profile',isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts")

  res.render('profile', {footer: true, user:user});
});

router.get('/search',isLoggedIn, function(req, res) {
  res.render('search', {footer: true});
});

router.get('/followingpage', isLoggedIn, async function(req, res) {
  try {
    const loggedinuser =await req.user.populate("following")

    if (!loggedinuser) {
      console.error('User not found in the request');
      return res.status(500).send('Internal Server Error');
    }


    // Extract _id values from the following array
    const excludedUserIds = loggedinuser.following.map(user => String(user._id));

    // Fetch users who are not in the following array
    const users = await userModel.find({ _id: { $nin: [...excludedUserIds, String(loggedinuser._id)] } });

    res.render('followingpage', { footer: true, users, loggedinuser });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get("/following/:name" , isLoggedIn, async(req,res,next) =>{
let user = await userModel.findOne({username:req.session.passport.user})
let user2 = await userModel.findById({_id:req.params.name})
if(user.following.indexOf(user2._id)  === -1 && user2.follower.indexOf(user._id) == -1){
  user.following.push(user2._id)
  user2.follower.push(user._id)
}else{
  user.following.splice(user.following.indexOf(user2._id), 1)
  user2.follower.splice(user2.follower.indexOf(user._id), 1)
}
await
user.save()
await user2.save()
res.redirect("/followingpage")


})

router.get("/following/delete/:id",isLoggedIn, async(req,res,next) => {
const user = await userModel.findOne({username:req.session.passport.user})
const user2 = await userModel.findById({_id:req.params.id})
if(user.following.includes(user2._id) && user2.follower.includes(user._id)){
  user.following.splice(user.following.indexOf(user2._id), 1)
  user2.follower.splice(user2.follower.indexOf(user._id), 1)
}
await
user.save()
await user2.save()
res.redirect("/followingpage")
console.log(user)
console.log(user2)
})

router.get("/followerpage",isLoggedIn,async(req,res,next) =>{
  const user = await userModel.findOne({username:req.session.passport.user}).populate("follower")
  res.render("followerpage",{footer:true,user})
})
router.get('/like/post/:id',isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user})
  const post = await postModel.findOne({_id : req.params.id})
  if(post.likes.indexOf(user._id)  === -1){
    post.likes.push(user._id)
  }else{
    post.likes.splice(post.likes.indexOf(user._id),1)
  }
  await post.save()
 res.redirect("/feed")
});

router.get('/edit',isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user})
  res.render('edit', {footer: true, user:user});
});

router.get('/upload',isLoggedIn, function(req, res) {
  res.render('upload', {footer: true});
});

router.get('/username/:name',isLoggedIn,async (req,res,next)=>{
  const regex = new RegExp(`^${req.params.name}`, 'i');
const users = await userModel.find({username:regex})
res.json(users)
})
router.post("/register",(req,res,next) =>{
  const user = new userModel({
    username:req.body.username,
    name:req.body.name,
    email:req.body.email

  })
  userModel.register( user, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile")
    })
  })
})

router.post('/login',passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/login"
}) ,function(req, res) {
});

router.get('/logout',function(req, res,next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.post("/update",isLoggedIn, upload.single("image"),async(req,res,next) =>{
const user = await userModel.findOneAndUpdate({username:req.session.passport.user},{
  username:req.body.username,
  name:req.body.name,
  bio:req.body.bio
},{
  new:true
})
if(req.file){
  user.profileImage = req.file.filename
}

await user.save()
req.login(user, function(err) {
  if (err) { return next(err); }
  return res.redirect("/profile");
});
})

router.post("/upload",isLoggedIn, upload.single("image"), async (req,res,next) =>{
const user = await userModel.findOne({username:req.session.passport.user})
 const post =await postModel.create({
  picture:req.file.filename,
  user:user._id,
  caption:req.body.caption,
})
user.posts.push(post._id)
await user.save()
res.redirect("/feed")
})
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next()
  res.redirect("/login")
}

module.exports = router;
