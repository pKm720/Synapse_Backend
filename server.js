import 'dotenv/config'
import app from './src/app.js'
import { connectDB } from './src/config/db.js'
import './src/workers/pipelineWorker.js'  // Activate Background Worker Listener

await connectDB()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
