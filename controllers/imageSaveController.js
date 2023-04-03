const cloudinary = require("cloudinary").v2;

const imageSave = async (req, res) => {
  const img = req.files.image;
  console.log(img);
  const result = await cloudinary.uploader.upload(img.tempFilePath, {
    use_filename: true,
    folder: "charity_events_img",
  });
  console.log(result);
};

module.exports = { imageSave };

// "http://res.cloudinary.com/dx1bggjvi/image/upload/v1680445657/charity_events_img/tmp-2-1680474704200_resjbk.jpg";
// 'https://res.cloudinary.com/dx1bggjvi/image/upload/v1680445657/charity_events_img/tmp-2-1680474704200_resjbk.jpg';
// "https://res.cloudinary.com/dx1bggjvi/image/upload/v1680445328/charity_events_img/tmp-1-1680474375982_zk6tzg.png";
