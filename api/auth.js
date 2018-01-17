const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const ms = require("ms")
const fs = require("fs")
const authHeader = require("auth-header")
const { Buffer } = require("buffer")
const { ObjectId } = require("mongodb")

require("express-async-errors")

const { HTTPError, validateRequest, schemas, runWithDB } = require("./util")

const PORT = 80
const JWT_SECRET = fs.readFileSync("/run/secrets/jwt.key")
const JWT_PUBLIC = fs.readFileSync("./jwt.key.pub")

/**
 * Sign a JWT token and build a response.
 * @param {ObjectId} userIdObject
 */
const getCredentials = userIdObject => {
  const userId = userIdObject.toString()
  const expiresIn = "15 mins"

  return {
    userId,
    tokenExpiration: new Date(Date.now() + ms(expiresIn)).toISOString(),
    token: jwt.sign({ sub: userId }, JWT_SECRET, {
      algorithm: "RS256",
      expiresIn
    })
  }
}

express()
  .use(express.json())

  /**
   * @swagger
   *  /auth/users:
   *    post:
   *      summary: Create a new user.
   *      requestBody:
   *        required: true
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/UserCreate"
   *      responses:
   *        201:
   *          description: >
   *            User creation was successful.
   *            Response contains access token.
   *          content:
   *            application/json:
   *              schema:
   *                $ref: "#/components/schemas/JwtCredentials"
   *        400:
   *          $ref: "#/components/responses/BadRequest"
   *        403:
   *          description: A user with that email already exists.
   *          content:
   *            application/json:
   *              schema:
   *                $ref: "#/components/schemas/Error"
   */
  .post("/users", (request, response) =>
    runWithDB(async db => {
      validateRequest(request, {
        bodySchema: schemas.UserCreate
      })

      const { email, password, name } = request.body

      const usersCollection = db.collection("users")
      const numEmailMatches = await usersCollection.find({ email }).count()

      if (numEmailMatches > 0) {
        throw new HTTPError(403, `A user with email "${email}" already exists.`)
      } else {
        const HASH_COST = 10
        const passwordHash = await bcrypt.hash(password, HASH_COST)

        const insertResult = await usersCollection.insertOne({
          email,
          passwordHash,
          name
        })

        if (!insertResult.result.ok) {
          throw new Error("Couldn't add to database")
        } else {
          response.status(201).send(getCredentials(insertResult.insertedId))
        }
      }
    })
  )

  /**
   * @swagger
   *  /auth/token:
   *    get:
   *      summary: Get a new token from email and password or from an old token.
   *      security:
   *        - BasicAuth: []
   *        - BearerAuth: []
   *      responses:
   *        200:
   *          description: Authorization was successful.
   *          content:
   *            application/json:
   *              schema:
   *                $ref: "#/components/schemas/JwtCredentials"
   *        401:
   *          description: >
   *            The email or password is incorrect or the authorization is
   *            otherwise invalid.
   *          content:
   *            application/json:
   *              schema:
   *                $ref: "#/components/schemas/Error"
   */
  .get(
    "/token",
    async (request, response) => {
      const authHeaderValue = request.header("Authorization")

      if (!authHeaderValue) {
        throw new HTTPError(401, "Authorization missing.")
      } else {
        let auth
        try {
          auth = authHeader.parse(authHeaderValue)
        } catch (error) {
          throw new HTTPError(401, "Invalid auth scheme.")
        }

        if (auth.scheme === "Basic") {
          const [email, password] = Buffer.from(auth.token, "base64")
            .toString()
            .split(":", 2)

          await runWithDB(async db => {
            const usersCollection = db.collection("users")
            const user = await usersCollection.find({ email }).next()

            if (!user) {
              throw new HTTPError(401, "Incorrect email.")
            } else if (!await bcrypt.compare(password, user.passwordHash)) {
              throw new HTTPError(401, "Incorrect password.")
            } else {
              response.status(200).send(getCredentials(user._id))
            }
          })
        } else if (auth.scheme === "Bearer") {
          let token
          try {
            token = jwt.verify(auth.token, JWT_PUBLIC, {
              ignoreExpiration: true
            })
          } catch (error) {
            throw new HTTPError(401, "Invalid bearer token.")
          }

          response.status(200).send(getCredentials(new ObjectId(token.sub)))
        } else {
          throw new HTTPError(401, "Auth scheme not supported.")
        }
      }
    },
    (error, request, response, next) => {
      if (error instanceof HTTPError && error.status === 401) {
        response.header("WWW-Authenticate", ["Basic", "Bearer"])
      }
      next(error)
    }
  )

  .all("/*", () => {
    throw new HTTPError(404, "Not found")
  })

  .use((error, request, response, next) => {
    if (error instanceof HTTPError) {
      response.status(error.status).send({ message: error.message })
    } else {
      console.error(error)
      response.status(500).send({ message: "Server error" })
    }
  })

  .listen(PORT, () => {
    console.log("Auth API serving.")
  })
