const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const env = require("dotenv");
env.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(process.env.MONGO_URI);

const itemSchema = mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemSchema);

const listSchema = mongoose.Schema({
  name: String,
  list: [itemSchema],
});
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add new items",
});
const item3 = new Item({
  name: "<-- Hit this to delete items",
});

const defaultItems = [item1, item2, item3];

app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (e) {
        if (e) {
          console.log("Error while inserting default items", e);
        } else {
          console.log("Successfully added 3 items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", itemList: foundItems });
    }
  });
});

app.get("/:listTitle", (req, res) => {
  const title = _.capitalize(req.params.listTitle);
  if (title && title != "favicon.ico") {
    List.findOne({ name: title }, (err, foundList) => {
      if (!foundList) {
        const newList = List({
          name: title,
          list: defaultItems,
        });
        newList.save();
        console.log("Created list for new title", title);
        res.redirect("/" + title);
      } else {
        res.render("list", { listTitle: title, itemList: foundList.list });
      }
    });
  }
});

app.post("/", (req, res) => {
  const listTitle = req.body.submit;
  const newItem = new Item({
    name: req.body.newItem,
  });
  if (listTitle === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, (err, foundList) => {
      if (!err) {
        if (foundList) {
          foundList.list.push(newItem);
          foundList.save();
          console.log("Added item to the list:", listTitle);
          res.redirect("/" + listTitle);
        }
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  const listTitle = req.body.deletedTitle;
  if (listTitle === "Today") {
    Item.findByIdAndDelete(id, (err) => {
      if (!err) {
        console.log("Successfully deleted item: " + id);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listTitle },
      { $pull: { list: { _id: id } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listTitle);
        } else {
          console.log(err);
        }
      }
    );
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("server is running on port 3000");
});
