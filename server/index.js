const express = require("express")
const cors = require("cors")
const { MongoClient } = require("mongodb")
const bodyParser = require("body-parser")

require("express-async-errors")

const STATIC_PORT = 5000
const API_PORT = 5050

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
  .use(express.static(`${__dirname}/../webapp/build`))

  .listen(STATIC_PORT, () => {
    console.log(`Serving static files on port ${STATIC_PORT}`)
  })

express()
  .use(cors())
  .use(bodyParser.json())

  .get("/tasks", (request, response) =>
    runWithDB(async db => {
      const tasksCollection = db.collection("tasks")
      const allTasks = tasksCollection.find()

      response.status(200).send({
        items: await allTasks.toArray()
      })
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
        throw Error("Couldn't add to database")
      }

      response.status(201).send({ item: newTask })
    })
  )

  .patch("/tasks/:taskId", (request, response) =>
    runWithDB(async db => {
      const tasksCollection = db.collection("tasks")

      const { taskId } = request.params
      const updateResult = await tasksCollection.updateOne(
        { _id: ObjectId(taskId) },
        { $set: request.body }
      )

      if (!updateResult.result.ok) {
        throw new Error("Couldn't update database")
      }

      response.sendStatus(204)
    })
  )

  .delete("/tasks/:taskId", (request, response) =>
    runWithDB(async db => {
      const tasksCollection = db.collection("tasks")

      const { taskId } = request.params
      const deleteResult = await tasksCollection.findOneAndDelete({
        _id: ObjectId(taskId)
      })

      if (!deleteResult.ok) {
        throw new Error("Couldn't update database")
      }

      response.status(200).send({ item: deleteResult.value })
    })
  )

  .use((error, request, response, next) => {
    console.error(error)

    if (process.env.NODE_ENV === "production") {
      response.status(500).send({ error: true })
    } else {
      response.status(500).send({
        error: {
          code: error.code,
          message: error.message,
          stack: error.stack
        }
      })
    }
  })

  .listen(API_PORT, () => {
    console.log(`Serving API on port ${API_PORT}`)
  })
