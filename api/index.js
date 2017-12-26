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

      const tasksCollection = db.collection("tasks")
      const allTasks = tasksCollection.find().sort("_id", -1)

      response.status(200).send({ items: await allTasks.toArray() })
    } catch (error) {
      response.status(500).send({ error })
      console.error(error)
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
        throw Error("Couldn't add to database")
      }

      response.status(201).send({ item: newTask })
    } catch (error) {
      response.status(500).send({ error })
      console.error(error)
    } finally {
      db.close()
    }
  })

  .listen(PORT, () => {
    console.log("Serving API.")
  })
