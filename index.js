// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const validUrl = require('valid-url');
const ShortUniqueId = require('short-unique-id');
//mongoose configuration
const mongoose = require('mongoose');
const dbKey = process.env['MONGO_URI'];
mongoose.connect(dbKey, {useNewUrlParser : true, useUnifiedTopology : true})
//check my db connection
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error : '));
connection.once('open', () => {
  console.log("successfully mongoose to mongo :)")
});
//body-parser configuration
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : false}))


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
//create mongoose schema 
const shortUrl = new mongoose.Schema({
  original_url : String,
  short_url : String,
})
//create new mongoose Model
const URL = new mongoose.model('URL', shortUrl);

//post method url shorten
app.post('/api/shorturl', async function(req, res){
  const originalUrl = req.body.url;
  const uid = new ShortUniqueId();
  const shortenUrl = uid();

  if(!validUrl.isWebUri(originalUrl)){
    res.json({error : "invalid url"});
  }else{
    try{
      let findOne = await URL.findOne({original_url : originalUrl});

      if(findOne){
        res.json({original_url : findOne.original_url, shortUrl : findOne.short_url})
      }else{
        let newUrl = new URL({
          original_url : originalUrl,
          short_url : shortenUrl,
        });
        await newUrl.save();
        res.json({
          original_url : newUrl.original_url,
          short_url : newUrl.short_url
        })
      }
    }catch(error){
      console.log(error);
      res.send(error);
    }
  }
})

app.get('/api/shorturl/:userInput',async function(req, res){
  const getUrl = req.params.userInput;
  try{
    const searchUrl = await URL.findOne({short_url : getUrl});
    if(searchUrl){
      return res.redirect(searchUrl.original_url)
    }else{
      return res.status(404).json({error : "Not found in database, may be it is not shorten"})
    }
    
  }catch(error){
    console.log(error);
    res.json({errorMessage : error})
  }
})
// Your first API endpoint
// app.post('/api/hello', function(req, res) {
//   const url = req.body.url 
//   res.json({ greeting: url });
// });

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
