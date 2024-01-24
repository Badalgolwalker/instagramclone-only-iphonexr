var mongoose = require("mongoose")
var plm = require("passport-local-mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/insta-clone")

var userSchema = mongoose.Schema({
  username:String,
  name:String,
  email:String,
  profileImage:{
    type:String,
    default:"love.png"
  },
  bio:String,
  posts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'post'
  }],
  follower:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  }],
  following:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  }],

  password:String,
})
userSchema.plugin(plm)
module.exports = mongoose.model("user",userSchema)