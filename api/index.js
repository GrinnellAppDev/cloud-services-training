const express = require("express")
const cors = require("cors")
const { MongoClient, ObjectId } = require("mongodb")
const bodyParser = require("body-parser")

require("express-async-errors")

const PORT = 2000

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
      const allTasks = tasksCollection.find().sort("_id", -1)

      response.status(200).send(await allTasks.toArray())
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

      if (!updateResult.result.ok) {
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

      if (!deleteResult.ok) {
        throw new Error("Couldn't update database")
      } else {
        response.status(204).send()
      }
    })
  )

  .use((error, request, response, next) => {
    console.error(error)
    response.status(500).send({ message: "Server error" })
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
