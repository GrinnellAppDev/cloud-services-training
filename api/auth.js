const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const ms = require("ms")
const fs = require("fs")
const authHeader = require("auth-header")
const { Buffer } = require("buffer")
const { ObjectId } = require("mongodb")
const helmet = require("helmet")
const normalizeEmail = require("normalize-email")

require("express-async-errors")

const { HTTPError, validateRequest, schemas, runWithDB } = require("./util")

const PORT = 80
const JWT_SECRET = fs.readFileSync("/run/secrets/jwt.key")
const JWT_PUBLIC = fs.readFileSync("./jwt.key.pub")

/**
 * Sign a JWT token and build a response.
 * @param {ObjectId} userId
 */
const getCredentials = userId => {
  const expiresIn = "15 mins"

  return {
    tokenExpiration: new Date(Date.now() + ms(expiresIn)).toISOString(),
    token: jwt.sign({ sub: userId.toString() }, JWT_SECRET, {
      algorithm: "RS256",
      expiresIn
    })
  }
}

express()
  .use(helmet({ dnsPrefetchControl: false }))
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

      const email = normalizeEmail(request.body.email)
      const { password, name } = request.body

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
          name: name || null
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
   *  /auth/users/me:
   *    get:
   *      summary: Get the details of the current user.
   *      security:
   *        - BearerAuth: []
   *      responses:
   *        200:
   *          description: Successfully retrieved user.
   *          content:
   *            application/json:
   *              schema:
   *                $ref: "#/components/schemas/User"
   *        400:
   *          $ref: "#/components/responses/BadRequest"
   *        401:
   *          $ref: "#/components/responses/Unauthorized"
   */
  .get("/users/me", (request, response) =>
    runWithDB(async db => {
      validateRequest(request, {})

      let token
      try {
        const auth = authHeader.parse(request.header("Authorization"))
        if (auth.scheme !== "Bearer") {
          throw new Error()
        }

        token = jwt.verify(auth.token, JWT_PUBLIC)
      } catch (error) {
        response.header("WWW-Authenticate", "Bearer")
        throw new HTTPError(401, "Invalid token.")
      }

      const userId = new ObjectId(token.sub)

      const usersCollection = db.collection("users")
      const user = await usersCollection.findOne({ _id: userId })

      response.status(200).send({
        name: user.name || undefined,
        email: user.email
      })
    })
  )

  /**
   * @swagger
   *  /auth/token:
   *    get:
   *      summary: Get a new token from email and password or from an old token.
   *      description: >
   *        Remember, **expired tokens are allowed** here. Because of the sensitivity
   *        of passwords, it is recommended to use an expired token for authorization
   *        whenever possible. Email/password auth should only be attempted during
   *        initial sign in, when the client possesses no token, or if none tokens in
   *        the client's possession are accepted.
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
   *        400:
   *          $ref: "#/components/responses/BadRequest"
   *        401:
   *          description: >
   *            The email or password is incorrect or the authorization is otherwise
   *            invalid. Tokens can be invalidated for any reason at any time. If a token
   *            is rejected, the client should try any other tokens in their possession,
   *            and only then attempt email/password validation.
   *          content:
   *            application/json:
   *              schema:
   *                $ref: "#/components/schemas/Error"
   */
  .get(
    "/token",
    async (request, response) => {
      validateRequest(request, {})

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
            const user = await usersCollection
              .find({ email: normalizeEmail(email) })
              .next()

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
