const express = require("express")
const proxy = require("express-http-proxy")
const helmet = require("helmet")

const PORT = process.env.PORT || 4000

express()
  .use(
    helmet({
      dnsPrefetchControl: false,
      contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
      referrerPolicy: { policy: "no-referrer" }
    })
  )

  .use(
    "/api",
    process.env.API_HOST
      ? proxy(process.env.API_HOST)
      : (request, response) => {
          response.sendStatus(404)
        }
  )

  .use(express.static(`${__dirname}/build`))

  .listen(PORT, () => {
    console.info("Webapp serving.")
  })
