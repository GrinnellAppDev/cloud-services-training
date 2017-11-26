const express = require("express")
const cors = require("cors")
const { MongoClient } = require("mongodb")
const bodyParser = require("body-parser")

const PORT = 2000

express()
  .use(cors())
  .use(bodyParser.json())

  .get("/tasks", async (request, response) => {
    let db
    try {
      db = await MongoClient.connect(process.env.MONGO_URL)

      throw new Error("Test error")

      const tasksCollection = db.collection("tasks")
      const allTasks = tasksCollection.find().sort("_id", -1)

      response.status(200).send({ items: await allTasks.toArray() })
    } catch (error) {
      throw error
    } finally {
      if (db) db.close()
    }
  })

  .post("/tasks", async (request, response) => {
    let db
    try {
      db = await MongoClient.connect(process.env.MONGO_URL)

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
    } catch (error) {
      throw error
    } finally {
      if (db) db.close()
    }
  })

  .patch("/tasks/:taskId", async (request, response) => {
    let db
    try {
      db = await MongoClient.connect(process.env.MONGO_URL)

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
    } catch (error) {
      throw error
    } finally {
      if (db) db.close()
    }
  })

  .delete("/tasks/:taskId", async (request, response) => {
    let db
    try {
      db = await MongoClient.connect(process.env.MONGO_URL)

      const tasksCollection = db.collection("tasks")

      const { taskId } = request.params

      const deleteResult = await tasksCollection.findOneAndDelete({
        _id: ObjectId(taskId)
      })

      if (!deleteResult.ok) {
        throw new Error("Couldn't update database")
      }

      response.status(200).send({ item: deleteResult.value })
    } catch (error) {
      throw error
    } finally {
      if (db) db.close()
    }
  })

  .use((error, request, response, next) => {
    console.error(error)
    if (process.env.NODE_ENV === "production") {
      response.status(500).send({ error: true })
    } else {
      response.status(500).send({ error })
    }
  })

  .listen(API_PORT, () => {
    console.log("Serving API.")
  })
