const express = require("express")
const cors = require("cors")
const { MongoClient, ObjectID, Db } = require("mongodb")
const bodyParser = require("body-parser")
const { Buffer } = require("buffer")
const urlsafeBase64 = require("urlsafe-base64")
const jsonschema = require("jsonschema")
const readYAML = require("read-yaml")

// @ts-ignore
require("express-async-errors")

const PORT = 2000

/**
 * @param {ObjectID} id
 */
const idToBase64 = id => urlsafeBase64.encode(Buffer.from(id.toString(), "hex"))

/**
 * @param {string} base64
 */
const base64ToId = base64 =>
  new ObjectID(urlsafeBase64.decode(base64).toString("hex"))

/**
 * @param {function(Db): Promise<void>} run
 */
const runWithDB = async run => {
  let db
  try {
    db = await MongoClient.connect(process.env.MONGO_URL)

    await run(db)
  } catch (error) {
    throw error
  } finally {
    if (db) db.close()
  }
}

const schemaValidator = new jsonschema.Validator()
const schemas = readYAML.sync("./schemas.yml")

express()
  .use(cors())
  .use(bodyParser.json())

  .get("/tasks", (request, response) =>
    runWithDB(async db => {
      const pageSizeValidation = schemaValidator.validate(
        request.query.pageSize,
        { type: "integer" }
      )
      const pageTokenIsValid =
        typeof request.query.pageToken === "string" &&
        urlsafeBase64.validate(request.query.pageToken)

      if (!pageSizeValidation.valid) {
        response.status(400).send({
          error: {
            status: 400,
            message:
              "Invalid query param (pageSize): " +
              pageSizeValidation.errors[0].stack
          }
        })
      } else if (!pageTokenIsValid) {
        response.status(400).send({
          error: {
            status: 400,
            message: "Invalid query param (pageToken)"
          }
        })
      } else {
        const tasksCollection = db.collection("tasks")

        /** @type {number} */ const pageSize = +request.query.pageSize || 10
        /** @type {string} */ const pageToken = request.query.pageToken || null

        const allTasks = pageToken
          ? tasksCollection.find({ _id: { $gte: base64ToId(pageToken) } })
          : tasksCollection.find()

        const readTasks = await allTasks
          .sort("_id", -1)
          .limit(pageSize + 1)
          .toArray()
        const items = readTasks.slice(0, pageSize)
        const nextPageFirstTask = readTasks[pageSize]
        const nextPageToken = nextPageFirstTask
          ? idToBase64(nextPageFirstTask._id)
          : null

        response.status(200).send({ items, nextPageToken })
      }
    })
  )

  .post("/tasks", (request, response) =>
    runWithDB(async db => {
      const bodyValidation = schemaValidator.validate(
        request.body,
        schemas.TaskCreate
      )

      if (!bodyValidation.valid) {
        response.status(400).send({
          error: {
            status: 400,
            message: "Invalid body: " + bodyValidation.errors[0].stack
          }
        })
      } else {
        const newTask = {
          ...request.body,
          isComplete: false
        }

        const tasksCollection = db.collection("tasks")
        const insertResult = await tasksCollection.insertOne(newTask)

        if (!insertResult.result.ok) {
          throw Error("Couldn't add to database")
        }

        response.status(201).send({ item: newTask })
      }
    })
  )

  .patch("/tasks/:taskId", (request, response) =>
    runWithDB(async db => {
      const bodyValidation = schemaValidator.validate(
        request.body,
        schemas.TaskEdit
      )
      const taskIdValidation = schemaValidator.validate(
        request.params.taskId,
        schemas.ObjectID
      )

      if (!bodyValidation.valid) {
        response.status(400).send({
          error: {
            status: 400,
            message: "Invalid body: " + bodyValidation.errors[0].stack
          }
        })
      } else if (!taskIdValidation.valid) {
        response.status(400).send({
          error: {
            status: 400,
            message:
              "Invalid path param (taskId): " + taskIdValidation.errors[0].stack
          }
        })
      } else {
        const tasksCollection = db.collection("tasks")

        const { taskId } = request.params
        const updateResult = await tasksCollection.updateOne(
          { _id: new ObjectID(taskId) },
          { $set: request.body }
        )

        if (updateResult.matchedCount < 1) {
          response.status(404).send({
            error: {
              status: 404,
              message: `No task with id "${taskId}"`
            }
          })
        } else if (!updateResult.result.ok) {
          throw Error("Couldn't update database")
        } else {
          response.status(204).send()
        }
      }
    })
  )

  .delete("/tasks/:taskId", (request, response) =>
    runWithDB(async db => {
      const taskIdValidation = schemaValidator.validate(
        request.params.taskId,
        schemas.ObjectID
      )

      if (!taskIdValidation.valid) {
        response.status(400).send({
          error: {
            status: 400,
            message:
              "Invalid path param (taskId): " + taskIdValidation.errors[0].stack
          }
        })
      } else {
        const tasksCollection = db.collection("tasks")

        const { taskId } = request.params
        const deleteResult = await tasksCollection.findOneAndDelete({
          _id: new ObjectID(taskId)
        })

        if (!deleteResult.value) {
          response.status(404).send({
            error: {
              status: 404,
              message: `No task with id "${taskId}"`
            }
          })
        } else if (!deleteResult.ok) {
          throw Error("Couldn't update database")
        } else {
          response.status(200).send({ item: deleteResult.value })
        }
      }
    })
  )

  .all("/*", (request, response) => {
    response.status(404).send({
      error: {
        status: 404,
        message: "Not found"
      }
    })
  })

  .use((error, request, response, next) => {
    console.error(error)

    if (process.env.NODE_ENV === "production") {
      response.status(500).send({
        error: {
          status: 500,
          message: "Server error"
        }
      })
    } else {
      response.status(500).send({
        error: {
          status: 500,
          code: error.code,
          message: error.message,
          stack: error.stack
        }
      })
    }
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
