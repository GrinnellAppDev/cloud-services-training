const express = require("express")

const STATIC_PORT = 5000
const API_PORT = 5050

express()
  .use(express.static("../webapp/build"))

  .listen(STATIC_PORT, () => {
    console.log(`Serving static files on port ${STATIC_PORT}`)
  })

express()
  .get("/tasks", (request, response) => {
    response.status(200).send({
      items: [
        {
          id: "sl2ei3hf3iw",
          title: "Collect underpants",
          completed: false
        },
        {
          id: "tl2ei323xze",
          title: "???",
          completed: false
        },
        {
          id: "uz2ei32cx7e",
          title: "Profit!",
          completed: false
        }
      ]
    })
  })

  .listen(API_PORT, () => {
    console.log(`Serving API on port ${API_PORT}`)
  })
