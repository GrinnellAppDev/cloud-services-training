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

  .all("/*", (request, response) => {
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

      if (process.env.NODE_ENV === "production") {
        response.status(500).send({
          error: {
            message: "Server error"
          }
        })
      } else {
        response.status(500).send({
          error: {
            code: error.code,
            message: error.message,
            stack: error.stack
          }
        })
      }
    }
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
