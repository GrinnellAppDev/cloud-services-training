const express = require("express")
const cors = require("cors")
const { MongoClient } = require("mongodb")

const PORT = 80

express()
  .use(cors())
  .use(express.json())

  .get("/tasks", async (request, response) => {
    let db
    try {
      db = await MongoClient.connect(process.env.MONGO_URL)

      const tasksCollection = db.collection("tasks")
      const allTasks = tasksCollection.find().sort("_id", -1)

      response.status(200).send(await allTasks.toArray())
    } catch (error) {
      console.error(error)
      response.status(500).send({ message: "Server error" })
    } finally {
      db.close()
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
        throw new Error("Couldn't add to database")
      } else {
        response.status(201).send(newTask)
      }
    } catch (error) {
      console.error(error)
      response.status(500).send({ message: "Server error" })
    } finally {
      db.close()
    }
  })

  .listen(PORT, () => {
    console.log("API serving.")
  })
