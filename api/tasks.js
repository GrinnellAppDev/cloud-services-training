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
  /**
   * @swagger
   *  /tasks:
   *    get:
   *      summary: Get a list of all tasks
   *      parameters:
   *        - name: pageSize
   *          in: query
   *          description: Maximum number of items per response
   *          schema:
   *            type: integer
   *            default: 10
   *        - name: pageToken
   *          in: query
   *          description: Token representing a particular page of results
   *          schema:
   *            type: string
   *      responses:
   *        200:
   *          description: An array of tasks
   *          headers:
   *            Link:
   *              schema:
   *                type: string
   *              description: >
   *                Standard HTTP Link header. All URIs relative to the /tasks endpoint.
   *          content:
   *            application/json:
   *              schema:
   *                type: array
   *                items:
   *                  $ref: "#/components/schemas/Task"
   *        400:
   *          $ref: "#/components/responses/BadRequest"
   */
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

      let pageTokenValue = null
      if (pageToken) {
        try {
          pageTokenValue = base64ToId(pageToken)
        } catch (error) {
          throw new HTTPError(400, "Invalid pageToken.")
        }
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
        response.links({
          next: `tasks?${querystring.stringify({
            ...request.query,
            pageToken: idToBase64(nextPageFirstTask._id)
          })}`
        })
      }

      response.status(200).send(items)
    })
  )

  /**
   * @swagger
   *  /tasks:
   *    post:
   *      summary: Create a new, incomplete task
   *      requestBody:
   *        required: true
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/TaskCreate"
   *      responses:
   *        201:
   *          description: >
   *            Task creation was successful.
   *            Response contains the newly created task.
   *          content:
   *            application/json:
   *              schema:
   *                $ref: "#/components/schemas/Task"
   *        400:
   *          $ref: "#/components/responses/BadRequest"
   */
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

  /**
   * @swagger
   *  /tasks/{taskId}:
   *    patch:
   *      summary: Update a task's fields.
   *      requestBody:
   *        required: true
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/TaskEdit"
   *      parameters:
   *        - name: taskId
   *          in: path
   *          description: The unique ID of a task.
   *          schema:
   *            type: string
   *            format: objectId
   *      responses:
   *        204:
   *          description: Task update was successful. No content.
   *        400:
   *          $ref: "#/components/responses/BadRequest"
   *        404:
   *          $ref: "#/components/responses/NotFound"
   */
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

  /**
   * @swagger
   *  /tasks/{taskId}:
   *    delete:
   *      summary: Delete a task.
   *      parameters:
   *        - name: taskId
   *          in: path
   *          description: The unique ID of a task.
   *          schema:
   *            type: string
   *            format: objectId
   *      responses:
   *        204:
   *          description: Task was successfully deleted. No content.
   *        400:
   *          $ref: "#/components/responses/BadRequest"
   *        404:
   *          $ref: "#/components/responses/NotFound"
   */
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
