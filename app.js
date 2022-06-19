//jshint esversion:6

const express = require("express");

const mongoose = require('mongoose');

const _ = require('lodash');


const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = mongoose.Schema({
  todo: {
    type: String,
    required: [true, "Please enter a Task to do."]
  }//,
  // status: {
  //   type: String,
  //   enum: ['incomplete', 'complete']
  // }
});

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model('List', listSchema);

const Item = mongoose.model('Item', itemsSchema);

// const workItem = mongoose.model('workItem', todoSchema);

const item1 = new Item({
  todo: 'Welcome to ToDo List!'
})

const item2 = new Item({
  todo: 'Hit the + button to Add new Item.'
})

const item3 = new Item({
  todo: '<-- Hit this to Delete Item.>'
})

app.get("/",async function(req, res) {
  await mongoose.connect("mongodb://localhost:27017/todoDB");
  Item.find(async (err, items)=>{
    if(items.length == 0){
      await Item.insertMany([item1, item2, item3]);
      mongoose.connection.close();
      res.redirect('/');
    }else{
      mongoose.connection.close();
      res.render("list", {listTitle: 'Today', newListItems: items});
    }
    
  });
  

});

app.get("/:customList", async function(req, res) {

  const customList = _.startCase(req.params.customList);
  await mongoose.connect("mongodb://localhost:27017/todoDB");

  List.findOne({name: customList},async (err, list)=>{
    if(list){
      res.render('list', {listTitle: list.name, newListItems: list.items} )
    }else{
      const list = new List({
        name: customList,
        items: [item1, item2, item3]
      });
    
      await list.save();
      res.redirect('/'+customList);
    }
  })
  
  

})

app.post("/", async function(req, res){
  await mongoose.connect("mongodb://localhost:27017/todoDB");
  const newItem = req.body.newItem;
  const listTitle = req.body.list;

  const item = new Item({
    todo: newItem,
  })
  if(listTitle !== "Today"){
    List.findOne({name: listTitle}, async (err, list)=>{
      if(!err){
        list.items.push(item);
        await list.save((err)=>{
          if(!err){
            res.redirect('/'+listTitle);
          }
        })
      }else{
        console.log(err);
      }
    })
  }else{
    
    await item.save((err)=>{
      if(err){
        console.log(err);  
      }
      res.redirect('/');
    });
  }
  
  
});

app.post('/delete',async (req, res)=>{
  // console.log(req.body.itemId);
  const itemId = req.body.itemId;
  const listName = req.body.listName;
  await mongoose.connect("mongodb://localhost:27017/todoDB");
  if(listName !== "Today"){
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, (err, list)=>{
      res.redirect('/'+listName);
    });
  }else{
    await Item.deleteOne({_id: req.body.itemId});
    mongoose.connection.close();
    res.redirect('/');
}

})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
