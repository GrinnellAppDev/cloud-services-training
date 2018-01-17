const express = require("express")
const proxy = require("express-http-proxy")

const PORT = process.env.PORT || 80

express()
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
