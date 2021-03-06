const express = require("express");
const mongoose = require("mongoose");
const router = express();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const DropBox = require("../../models/muterPoll/dropBox");
const DropBoxAnswer = require("../../models/muterPoll/dropBoxAnswer");

// get all drop boxes
router.get("/dropBox", async (req, res) => {
  const dropBoxes = await DropBox.find();
  try {
    res.status(201).json({
      message_type: "success",
      message: "dropBoxes found",
      dropBoxes: dropBoxes,
    });
  } catch (error) {
    res.status(500).json({
      message_type: "error",
      message: "dropBoxes not found",
    });
  }
});

// Get the basic drop box info if one exists. (code, name, and question only.)
router.get("/dropBox/getDropBoxIfValid/:dropBoxCode", async (req, res) => {
  console.log(req.params.dropBoxCode);

  const correctDropBoxCode = await DropBox.find({
    dropBoxId: req.params.dropBoxCode,
  });

  if (correctDropBoxCode[0]) {
    const publicDropBoxInfo = {
      dropBoxId: correctDropBoxCode[0].dropBoxId,
      dropBoxName: correctDropBoxCode[0].dropBoxName,
      dropBoxQuestion: correctDropBoxCode[0].dropBoxQuestion,
      createdOn: correctDropBoxCode[0].createdOn,
    };
    try {
      res.status(201).json({
        message_type: "success",
        message: "dropBox found",
        publicDropBoxInfo: publicDropBoxInfo,
      });
    } catch (error) {
      res.status(500).json({
        message_type: "error",
        message: "dropBox not found",
      });
    }
  } else {
    res.status(404).json({
      message_type: "warning",
      message: "drop box does not exist",
    });
  }
});

// check if the drop box id and password are correct.
router.get(
  "/dropBox/checkIfDropBoxIdAndPasswordIsValid/:boxId/:boxPassword",
  async (req, res) => {
    const dropBox = await DropBox.find({
      dropBoxId: req.params.boxId,
    });
    try {
      console.log(dropBox[0].dropBoxPassword);
      if (dropBox[0] && dropBox[0].dropBoxPassword === req.params.boxPassword) {
        // password is correct

        return res.status(201).json({
          message_type: "success",
          message: "dropBox id and password are correct",
          is_correct: true,
        });
      } else {
        // password is incorrect.
        res.status(404).json({
          message_type: "error",
          message: "dropBox id or password incorrect",
        });
      }
    } catch (error) {
      res.status(500).json({
        message_type: "error",
        message: "dropBox id or password incorrect",
      });
    }
  }
);

// get drop box answers by id if password for the drop box is correct.
router.get(
  "/dropBox/getAnswersByIdAndPassword/:boxId/:boxPassword",
  async (req, res) => {
    const dropBox = await DropBox.find({
      dropBoxId: req.params.boxId,
    });
    const answers = await DropBoxAnswer.find({
      dropBoxId: req.params.boxId,
    });

    try {
      if (dropBox[0] && dropBox[0].dropBoxPassword === req.params.boxPassword) {
        return res.status(201).json({
          message_type: "success",
          message: "dropBox answers found",
          answers: answers,
        });
      } else {
        res.status(404).json({
          message_type: "error",
          message: "dropBox id or password incorrect",
        });
      }
    } catch (error) {
      res.status(500).json({
        message_type: "error",
        message: "Could not get drop box answers",
      });
    }
  }
);

// get drop box by id if password for the drop box is correct.
router.get(
  "/dropBox/getDropBoxByIdAndPassword/:boxId/:boxPassword",
  async (req, res) => {
    let dropBox = await DropBox.find({
      dropBoxId: req.params.boxId,
    });

    try {
      if (dropBox[0] && dropBox[0].dropBoxPassword === req.params.boxPassword) {
        return res.status(201).json({
          message_type: "success",
          message: "dropBox found",
          dropBox: dropBox[0],
        });
      } else {
        res.status(404).json({
          message_type: "error",
          message: "dropBox id or password incorrect",
        });
      }
    } catch (error) {
      res.status(500).json({
        message_type: "error",
        message: "Could not get drop box answers",
      });
    }
  }
);

router.post("/dropBox/sendUserDropBoxEmail", (req, res) => {
  try {
    const msg = {
      to: req.body.to,
      from: "traceton.timmerman@gmail.com",
      subject: req.body.subject,
      text: req.body.text,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
        return res.status(200).json({
          message_type: "success",
          message: "Drop Box email send",
        });
      })
      .catch((error) => {
        console.error(error);
        return res.status(200).json({
          message_type: "error",
          message: "Could not send drop box email",
          error: error,
        });
      });
  } catch (error) {
    res.status(500).json({
      message_type: "error",
      message: "Could not send drop box email",
    });
  }
});

// create new drop box
router.post("/dropBox/createNewDropBox", async (req, res) => {
  const dropBox = await new DropBox({
    dropBoxId: req.body.dropBoxId,
    dropBoxName: req.body.dropBoxName,
    dropBoxQuestion: req.body.dropBoxQuestion,
    dropBoxPassword: req.body.dropBoxPassword,
    dropBoxLocation: req.body.dropBoxLocation,
  });

  try {
    const newDropBox = await dropBox.save();
    console.log(newDropBox);
    res.status(201).json({
      message_type: "success",
      message: "dropBox created",
      newDropBox: newDropBox,
    });
  } catch (error) {
    res.status(500).json({
      message_type: "error",
      message: "Could not create new drop box",
    });
  }
});

router.post("/dropBox/createNewDropBoxAnswer", async (req, res) => {
  const answer = await new DropBoxAnswer({
    dropBoxId: req.body.dropBoxId,
    dropBoxAnswer: req.body.dropBoxAnswer,
  });
  try {
    const newAnswer = await answer.save();
    console.log(newAnswer);
    res.status(201).json({
      message_type: "success",
      message: "dropBox answer created",
      newAnswer: newAnswer,
    });
  } catch (error) {
    res.status(500).json({
      message_type: "error",
      message: "Could not create new drop box answer",
    });
  }
});

// delete drop box and drop box answers using id and password
router.delete(
  "/dropBox/deleteDropBox/:boxId/:boxPassword",
  async (req, res) => {
    const dropBox = await dropBox.find({
      dropBoxId: req.params.boxId,
    });
    try {
      if (dropBox[0] && dropBox[0].dropBoxPassword === req.params.boxPassword) {
        dropBox.remove();
        res.status(201).json({
          message_type: "success",
          message: "dropBox and drop box answers deleted",
        });
      } else {
        res.status(404).json({
          message_type: "error",
          message: "dropBox id or password incorrect",
        });
      }
    } catch (error) {
      res.status(500).json({
        message_type: "error",
        message: "Could not create new drop box answer",
      });
    }
  }
);

module.exports = router;
