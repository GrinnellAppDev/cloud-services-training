const express = require("express")
const cors = require("cors")

const STATIC_PORT = process.env.STATIC_PORT || 5000
const API_PORT = process.env.API_PORT || 5050

express()
  .use(express.static(`${__dirname}/../webapp/build`))

  .listen(STATIC_PORT, () => {
    console.log(`Serving static files on port ${STATIC_PORT}`)
  })

express()
  .use(cors())

  .get("/tasks", (request, response) => {
    response.status(200).send({
      items: [
        {
          id: "sl2ei3hf3iw",
          title: "Collect underpants",
          isComplete: false
        },
        {
          id: "tl2ei323xze",
          title: "???",
          isComplete: false
        },
        {
          id: "uz2ei32cx7e",
          title: "Profit!",
          isComplete: false
        }
      ]
    })
  })

  .listen(API_PORT, () => {
    console.log(`Serving API on port ${API_PORT}`)
  })
