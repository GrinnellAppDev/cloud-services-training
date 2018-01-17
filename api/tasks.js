const { Router } = require("express")
const { ObjectId } = require("mongodb")
const querystring = require("querystring")

const {
  runWithDB,
  validateRequest,
  base64ToId,
  idToBase64,
  schemas,
  HTTPError
} = require("./util")

module.exports = Router()
  .get("/", (request, response) =>
    runWithDB(async db => {
      validateRequest(request, {
        querySchemaProps: {
          pageSize: { type: "string", pattern: "^\\d+$" },
          pageToken: { type: "string", format: "urlsafeBase64" }
        }
      })

      const tasksCollection = db.collection("tasks")

      /** @type {number} */ const pageSize = +request.query.pageSize || 10
      /** @type {string} */ const pageToken = request.query.pageToken || null

      let pageTokenValue
      try {
        pageTokenValue = base64ToId(pageToken)
      } catch (error) {
        throw new HTTPError(400, "Invalid pageToken.")
      }

      const allTasks = pageToken
        ? tasksCollection.find({ _id: { $lte: pageTokenValue } })
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
    })
  )

  .post("/", (request, response) =>
    runWithDB(async db => {
      validateRequest(request, {
        bodySchema: schemas.TaskCreate
      })

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
    })
  )

  .patch("/:taskId", (request, response) =>
    runWithDB(async db => {
      validateRequest(request, {
        paramSchemaProps: {
          taskId: { type: "string", format: "objectId" }
        },
        bodySchema: schemas.TaskEdit
      })

      const tasksCollection = db.collection("tasks")

      const { taskId } = request.params
      const updateResult = await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: request.body }
      )

      if (updateResult.matchedCount < 1) {
        throw new HTTPError(404, `No task with id "${taskId}"`)
      } else if (!updateResult.result.ok) {
        throw new Error("Couldn't update database")
      } else {
        response.status(204).send()
      }
    })
  )

  .delete("/:taskId", (request, response) =>
    runWithDB(async db => {
      validateRequest(request, {
        paramSchemaProps: {
          taskId: { type: "string", format: "objectId" }
        }
      })

      const tasksCollection = db.collection("tasks")

      const { taskId } = request.params
      const deleteResult = await tasksCollection.findOneAndDelete({
        _id: new ObjectId(taskId)
      })

      if (!deleteResult.value) {
        throw new HTTPError(404, `No task with id "${taskId}"`)
      } else if (!deleteResult.ok) {
        throw new Error("Couldn't update database")
      } else {
        response.status(204).send()
      }
    })
  )
