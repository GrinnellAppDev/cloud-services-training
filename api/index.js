const express = require("express")
const { MongoClient, ObjectId, Db } = require("mongodb")
const { Buffer } = require("buffer")
const urlsafeBase64 = require("urlsafe-base64")
const querystring = require("querystring")
const jsonschema = require("jsonschema")
const readYAML = require("read-yaml")

require("express-async-errors")

const PORT = 80

/**
 * @param {ObjectId} id
 */
const idToBase64 = id => urlsafeBase64.encode(Buffer.from(id.toString(), "hex"))

/**
 * @param {string} base64
 */
const base64ToId = base64 =>
  new ObjectId(urlsafeBase64.decode(base64).toString("hex"))

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

const schemas = readYAML.sync("./schemas.yml")
const schemaValidator = new jsonschema.Validator()

schemaValidator.customFormats.urlsafeBase64 = input =>
  urlsafeBase64.validate(input)
schemaValidator.customFormats.objectId = input => ObjectId.isValid(input)

express()
  .use(express.json())

  .get("/tasks", (request, response) =>
    runWithDB(async db => {
      const queryValidation = schemaValidator.validate(
        request.query,
        {
          type: "object",
          additionalProperties: false,
          properties: {
            pageSize: { type: "integer" },
            pageToken: { type: "string", format: "urlsafeBase64" }
          }
        },
        { propertyName: "query" }
      )

      if (!queryValidation.valid) {
        response.status(400).send({
          message: "Invalid request: " + queryValidation.errors[0].stack
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

        if (nextPageFirstTask) {
          const protocol = request.protocol
          const host = request.get("host")
          const path = request.baseUrl + request.path
          const query = querystring.stringify({
            ...request.query,
            pageToken: idToBase64(nextPageFirstTask._id)
          })

          response.links({
            next: `${protocol}://${host}${path}?${query}`
          })
        }

        response.status(200).send(items)
      }
    })
  )

  .post("/tasks", (request, response) =>
    runWithDB(async db => {
      const bodyValidation = schemaValidator.validate(
        request.body,
        schemas.TaskCreate,
        { propertyName: "body" }
      )

      if (!bodyValidation.valid) {
        response.status(400).send({
          message: "Invalid request: " + bodyValidation.errors[0].stack
        })
      } else {
        const newTask = {
          ...request.body,
          isComplete: false
        }

        const tasksCollection = db.collection("tasks")
        const insertResult = await tasksCollection.insertOne(newTask)

        if (!insertResult.result.ok) {
          throw new Error("Couldn't add to database")
        } else {
          response.status(201).send(newTask)
        }
      }
    })
  )

  .patch("/tasks/:taskId", (request, response) =>
    runWithDB(async db => {
      const bodyValidation = schemaValidator.validate(
        request.body,
        schemas.TaskEdit,
        { propertyName: "body" }
      )
      const pathParamValidation = schemaValidator.validate(
        request.params,
        {
          type: "object",
          properties: {
            taskId: { type: "string", format: "objectId" }
          }
        },
        { propertyName: "path params" }
      )

      if (!bodyValidation.valid) {
        response.status(400).send({
          message: "Invalid request: " + bodyValidation.errors[0].stack
        })
      } else if (!pathParamValidation.valid) {
        response.status(400).send({
          message: "Invalid request: " + pathParamValidation.errors[0].stack
        })
      } else {
        const tasksCollection = db.collection("tasks")

        const { taskId } = request.params
        const updateResult = await tasksCollection.updateOne(
          { _id: new ObjectId(taskId) },
          { $set: request.body }
        )

        if (updateResult.matchedCount < 1) {
          response.status(404).send({ message: `No task with id "${taskId}"` })
        } else if (!updateResult.result.ok) {
          throw new Error("Couldn't update database")
        } else {
          response.status(204).send()
        }
      }
    })
  )

  .delete("/tasks/:taskId", (request, response) =>
    runWithDB(async db => {
      const pathParamValidation = schemaValidator.validate(
        request.params,
        {
          type: "object",
          properties: {
            taskId: { type: "string", format: "objectId" }
          }
        },
        { propertyName: "path params" }
      )

      if (!pathParamValidation.valid) {
        response.status(400).send({
          message: "Invalid request: " + pathParamValidation.errors[0].stack
        })
      } else {
        const tasksCollection = db.collection("tasks")

        const { taskId } = request.params
        const deleteResult = await tasksCollection.findOneAndDelete({
          _id: new ObjectId(taskId)
        })

        if (!deleteResult.value) {
          response.status(404).send({ message: `No task with id "${taskId}"` })
        } else if (!deleteResult.ok) {
          throw new Error("Couldn't update database")
        } else {
          response.status(204).send()
        }
      }
    })
  )

  .all("/*", (request, response) => {
    response.status(404).send({ message: "Not found" })
  })

  .use((error, request, response, next) => {
    console.error(error)
    response.status(500).send({ message: "Server error" })
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
