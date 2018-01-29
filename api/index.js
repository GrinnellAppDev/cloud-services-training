const express = require("express")

const PORT = 80

express()
  .get("/tasks", (request, response) => {
    response.status(200).send([
      {
        _id: "3l2ei3hf3iw",
        text: "Collect underpants",
        isComplete: false
      },
      {
        _id: "2l2ei323xze",
        text: "???",
        isComplete: false
      },
      {
        _id: "1z2ei32cx7e",
        text: "Profit!",
        isComplete: false
      }
    ])
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
