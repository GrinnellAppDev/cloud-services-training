const express = require("express")

const PORT = 2000

express()
  .use(express.static(`${__dirname}/build`))
  .listen(PORT, () => {
    console.info("Webapp serving.")
  })
