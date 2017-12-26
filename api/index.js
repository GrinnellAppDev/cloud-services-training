const express = require("express")
const cors = require("cors")

const PORT = 2000

express()
  .use(cors())

  .get("/tasks", (request, response) => {
    response.status(200).send({
      items: [
        {
          id: "3l2ei3hf3iw",
          title: "Collect underpants",
          isComplete: false
        },
        {
          id: "2l2ei323xze",
          title: "???",
          isComplete: false
        },
        {
          id: "1z2ei32cx7e",
          title: "Profit!",
          isComplete: false
        }
      ]
    })
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
