import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import * as express from 'express'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false })

  // Stripe needs the exact raw request bytes to verify the webhook
  // signature, so this path is excluded from the global JSON parser.
  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }))
  app.use(express.json())

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
