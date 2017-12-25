const express = require("express")
const cors = require("cors")
const { MongoClient } = require("mongodb")
const bodyParser = require("body-parser")

const STATIC_PORT = 5000
const API_PORT = 5050

express()
  .use(express.static(`${__dirname}/../webapp/build`))

  .listen(STATIC_PORT, () => {
    console.log(`Serving static files on port ${STATIC_PORT}`)
  })

express()
  .use(cors())
  .use(bodyParser.json())

  .get("/tasks", async (request, response) => {
    let db
    try {
      db = await MongoClient.connect(process.env.MONGO_URL)

      const tasksCollection = db.collection("tasks")
      const allTasks = tasksCollection.find()

      response.status(200).send({
        items: await allTasks.toArray()
      })
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
        isCompleted: false
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

  .listen(API_PORT, () => {
    console.log(`Serving API on port ${API_PORT}`)
  })
