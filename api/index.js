const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")

require("express-async-errors")

const tasksRouter = require("./tasks")
const { HTTPError } = require("./util")

const PORT = 2000

express()
  .use(cors())
  .use(bodyParser.json())

  .use("/tasks", tasksRouter)

  .all("/*", () => {
    throw new HTTPError(404, "Not found")
  })

  .use((error, request, response, next) => {
    if (error instanceof HTTPError) {
      response.status(error.status).send({
        error: {
          message: error.message
        }
      })
    } else {
      console.error(error)
      response.status(500).send({ message: "Server error" })
    }
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
