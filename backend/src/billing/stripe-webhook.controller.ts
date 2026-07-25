import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common'
import type { Request } from 'express'
import Stripe from 'stripe'
import { SupabaseService } from '../supabase/supabase.service'
import { StripeService } from './stripe.service'

@Controller('webhooks')
export class StripeWebhookController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stripe: StripeService
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string
  ): Promise<{ received: true }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured')

    let event: Stripe.Event
    try {
      // req.body is the raw Buffer here — see main.ts, which routes this
      // path through express.raw() instead of the global JSON parser so
      // the signature can be verified against the exact bytes Stripe sent.
      event = this.stripe.client.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        webhookSecret
      )
    } catch (err) {
      throw new BadRequestException(`invalid stripe signature: ${(err as Error).message}`)
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (typeof session.customer === 'string' && typeof session.subscription === 'string') {
          await this.syncSubscription(session.customer, session.subscription)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id
        await this.upsertSubscriptionStatus(customerId, subscription)
        break
      }
      default:
        break
    }

    return { received: true }
  }

  private async syncSubscription(customerId: string, subscriptionId: string): Promise<void> {
    const subscription = await this.stripe.client.subscriptions.retrieve(subscriptionId)
    await this.upsertSubscriptionStatus(customerId, subscription)
  }

  private async upsertSubscriptionStatus(
    customerId: string,
    subscription: Stripe.Subscription
  ): Promise<void> {
    const status =
      subscription.status === 'active' ? 'active' : mapStripeStatus(subscription.status)
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null

    await this.supabase.client
      .from('subscriptions')
      .update({
        stripe_subscription_id: subscription.id,
        status,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId)
  }
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): 'active' | 'canceled' | 'past_due' | 'incomplete' {
  if (status === 'canceled' || status === 'unpaid') return 'canceled'
  if (status === 'past_due') return 'past_due'
  if (status === 'active' || status === 'trialing') return 'active'
  return 'incomplete'
}
