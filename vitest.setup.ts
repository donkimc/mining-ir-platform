import { config } from 'dotenv'

config({ path: '.env.local' })
config({ path: '.env' })

// Integration tests must not hang on drizzle interactive push prompts.
process.env.PAYLOAD_DATABASE_PUSH = 'false'
