import 'dotenv/config'
import { createApp } from './app.js'
import { closeDatabasePool } from './db.js'

const port = Number(process.env.API_PORT || 3000)
const server = createApp().listen(port, () => {
	console.log(`Player Recommender API listening on port ${port}`)
})

async function shutdown() {
	server.close(async (error) => {
		if (error) {
			console.error('Failed to close API server cleanly.', error)
			process.exitCode = 1
		}
		try {
			await closeDatabasePool()
		} catch (closeError) {
			console.error('Failed to close database pool cleanly.', closeError)
			process.exitCode = 1
		}
	})
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
