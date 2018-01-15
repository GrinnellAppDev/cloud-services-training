const express = require("express")
const cors = require("cors")
const { MongoClient, ObjectId } = require("mongodb")
const bodyParser = require("body-parser")
const { Buffer } = require("buffer")
const urlsafeBase64 = require("urlsafe-base64")
const querystring = require("querystring")

require("express-async-errors")

const PORT = 2000

const idToBase64 = id => urlsafeBase64.encode(Buffer.from(id.toString(), "hex"))
const base64ToId = base64 =>
  new ObjectId(urlsafeBase64.decode(base64).toString("hex"))

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

express()
  .use(cors())
  .use(bodyParser.json())

  .get("/tasks", (request, response) =>
    runWithDB(async db => {
      const tasksCollection = db.collection("tasks")

      const pageSize = +request.query.pageSize || 10
      const pageToken = request.query.pageToken || null

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
    })
  )

  .post("/tasks", (request, response) =>
    runWithDB(async db => {
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

  .patch("/tasks/:taskId", (request, response) =>
    runWithDB(async db => {
      const tasksCollection = db.collection("tasks")

      const { taskId } = request.params
      const updateResult = await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: request.body }
      )

      if (updateResult.matchedCount < 1) {
        response.status(404).send({
          message: `No task with id "${taskId}"`
        })
      } else if (!updateResult.result.ok) {
        throw new Error("Couldn't update database")
      } else {
        response.status(204).send()
      }
    })
  )

  .delete("/tasks/:taskId", (request, response) =>
    runWithDB(async db => {
      const tasksCollection = db.collection("tasks")

      const { taskId } = request.params
      const deleteResult = await tasksCollection.findOneAndDelete({
        _id: new ObjectId(taskId)
      })

      if (!deleteResult.value) {
        response.status(404).send({
          message: `No task with id "${taskId}"`
        })
      } else if (!deleteResult.ok) {
        throw new Error("Couldn't update database")
      } else {
        response.status(204).send()
      }
    })
  )

  .all("/*", (request, response) => {
    response.status(404).send({
      message: "Not found"
    })
  })

  .use((error, request, response, next) => {
    console.error(error)
    response.status(500).send({ message: "Server error" })
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
