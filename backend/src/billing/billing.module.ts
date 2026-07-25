import { Module } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { BillingController } from './billing.controller'
import { StripeWebhookController } from './stripe-webhook.controller'
import { StripeService } from './stripe.service'

@Module({
  controllers: [BillingController, StripeWebhookController],
  providers: [SupabaseService, StripeService]
})
export class BillingModule {}
