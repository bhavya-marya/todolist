//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  try {
    await mongoose.connect("mongodb+srv://bhavya_marya:iloveclubpenguin@cluster0.y40xhfg.mongodb.net/todolistDB");
    const itemsSchema = {
      name: String
    };
    const Item = mongoose.model("Item", itemsSchema);
    const item1 = new Item({
      name: "Welcome to your ToDo List!"
    });
    const item2 = new Item({
      name: "Hit the + button to add new item."
    });
    const item3 = new Item({
      name: "<-- Hit this to delete an item."
    });
    const defaultItems = [item1, item2, item3];
    const listSchema = {
      name: String,
      items: [itemsSchema]
    }

    const List = mongoose.model("List", listSchema);

    app.get("/", async (req, res) => {

      const day = date.getDate();

      const foundItems = await Item.find({});
      if (foundItems.length === 0) {
        await Item.insertMany(defaultItems);
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }

    });

    app.get("/:customListName", async function (req, res) {
      const customListName = _.capitalize(req.params.customListName);
      const foundList = await List.findOne({ name: customListName }).exec();
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    });

    app.post("/", async function (req, res) {

      const day = date.getDate();
      const itemName = req.body.newItem;
      const listName = req.body.list;

      const item = new Item({
        name: itemName
      });

      if (listName === day) {
        console.log(listName);
        item.save();
        res.redirect("/");
      } else {
        const foundList = await List.findOne({ name: listName }).exec();
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });

    app.post("/delete", async function (req, res) {
      const id = req.body.checkbox;
      const listName = req.body.listName;
      const day = date.getDate();

      if (listName === day) {
        const delItem = await Item.findByIdAndRemove(id);
        console.log(delItem);
        res.redirect("/");
      } else {
        const x = await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: id } } });
        console.log(x);
        res.redirect("/" + listName);
      }

    });

    app.get("/work", function (req, res) {
      res.render("list", { listTitle: "Work List", newListItems: workItems });
    });

    app.get("/about", function (req, res) {
      res.render("about");
    });

    app.listen(3000, function () {
      console.log("Server started on port 3000");
    });
  }
  finally {
    //mongoose.connection.close();
  }
}

