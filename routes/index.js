var express = require("express");
var router = express.Router();
var Order_controller = require("../controller/order_controller");
var Book_controller = require("../controller/book_controller");
var Cart_controller = require("../controller/cart_controller");
var Cart = require("../controller/cart");
let date = require("date-and-time");
var AWS = require("aws-sdk");
var renameModule = require("../controller/edit_name");
// var upload_controller = require("../controller/upload_controller")

const UUID = require("uuid/v4");
var multer = require("multer");
var multerS3 = require("multer-s3");
var path = require("path");
const mime = require("mime");
var region = "us-west-2";
let awsConfig = {
  region: region,
  // endpoint: "http://localhost:8000",
  accessKeyId: "id",
  secretAccessKey: "keyhere"
};
AWS.config.update(awsConfig);
let docClient = new AWS.DynamoDB.DocumentClient();

/* GET home page. */
router.get("/", Book_controller.get_all_book);

router.get("/product/*_:id", Book_controller.get_detail_product);

router.get("/addtocart/:id", Cart_controller.add_to_cart);
// router.post("/addtocart", Cart_controller.add_to_cart);

router.get("/cart", Cart_controller.get_items_cart);

router.post("/updatecart", Cart_controller.update_cart);

router.get("/deletecart/:id", Cart_controller.delete_cart_item);

router.get("/admin", Book_controller.get_all_book2);

router.post("/add_detail_to_cart/:id", Cart_controller.add_to_cart2);

router.post("/editBook/:id", Book_controller.edit_book);

router.get("/deleteBook/:id", Book_controller.delete_book)


router.get("/check_out", Cart_controller.check_out)


router.post("/aSearchBook", Book_controller.admin_search_book);

var keyImgUpload = "";
var s3 = new AWS.S3();
var upload = multer({
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter: function (res, file, cb) {
    var filetypes = /jpeg|jpg|png|gif|bmp/;
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      "Error: File upload only supports the following filetypes - " + filetypes + "!! GO BACK !"
    );
  },
  storage: multerS3({
    s3: s3,
    bucket: "da2-book",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: function (req, file, cb) {
      console.log(file);
      keyImgUpload = renameModule.editName(req.body.newTieuDe) + "-" + UUID() + "." + mime.getExtension(file.mimetype);
      console.log(keyImgUpload);
      cb(null, keyImgUpload);
    }
  })
});
router.post("/addNewBook", upload.single("newImgUpload"),
  function (req, res, next) {
    var table = "DA2Book";
    var buket = "da2-book";
    var now = date.format(new Date(), "DD/MM/YYYY");
    var url =
      "https://" + buket + ".s3." + region + ".amazonaws.com/" + keyImgUpload;
    var params = {
      TableName: table,
      Item: {
        _bookID: UUID(),
        tieude: req.body.newTieuDe,
        theloai: renameModule.splitList(req.body.newTheLoai),
        tacgia: renameModule.splitList(req.body.newTacGia),
        sotrang: parseInt(req.body.newSoTrang),
        SKU: req.body.newSKU,
        ngayxuatban: req.body.newNgayXuatBan,
        nhaxuatban: req.body.newNhaXuatBan,
        kichthuoc: req.body.newKichThuoc,
        mota: req.body.newMoTa,
        ngonngu: req.body.newNgonNgu,
        dichgia: renameModule.splitList(req.body.newDichGia),
        tinhtrang: " ",
        ngaythem: now,
        danhdau: renameModule.splitList(req.body.newDanhDau),
        linkseo: renameModule.editName(req.body.newTieuDe),
        gia: parseFloat(req.body.newGia),
        hinhanh: renameModule.splitList(url)
      }
    };
    console.log(params);
    docClient.put(params, function (err, data) {
      if (err) {
        var params = {
          Bucket: buket,
          Delete: {
            Objects: [{
              Key: keyImgUpload
            }],
          },
        };
        s3.deleteObjects(params, function (err, data) {
          if (err) console.log(err, err.stack);
          else {
            console.log(data);
            res.send(JSON.stringify(err));
          }
        });
      } else {
        res.redirect("/admin");
      }
    });
  });

router.post("/addOrder", Order_controller.add_order);
router.get("/xacNhanOrder/:codeDef", Order_controller.xacNhanOrder);

module.exports = router;