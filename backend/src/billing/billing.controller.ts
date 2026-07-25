import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  UnauthorizedException
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { StripeService } from './stripe.service'

// Client calls this with its Supabase access token to start a subscription
// checkout. Everything that needs the Stripe secret key or the Supabase
// service-role key lives here, never in the Electron app.
@Controller('billing')
export class BillingController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stripe: StripeService
  ) {}

  @Post('checkout-session')
  async createCheckoutSession(
    @Headers('authorization') authorization?: string
  ): Promise<{ url: string }> {
    const token = authorization?.replace(/^Bearer\s+/i, '')
    if (!token) throw new UnauthorizedException('missing bearer token')

    const {
      data: { user },
      error: authError
    } = await this.supabase.client.auth.getUser(token)
    if (authError || !user?.email) throw new UnauthorizedException('invalid session')

    await this.supabase.client
      .from('profiles')
      .upsert({ id: user.id, email: user.email }, { onConflict: 'id' })

    const { data: existing } = await this.supabase.client
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const customerId =
      existing?.stripe_customer_id ??
      (await this.stripe.client.customers.create({ email: user.email })).id

    if (!existing) {
      await this.supabase.client
        .from('subscriptions')
        .insert({ user_id: user.id, stripe_customer_id: customerId, status: 'incomplete' })
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) throw new BadRequestException('STRIPE_PRICE_ID is not configured')

    const session = await this.stripe.client.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.CLIENT_CHECKOUT_SUCCESS_URL,
      cancel_url: process.env.CLIENT_CHECKOUT_CANCEL_URL
    })

    if (!session.url) throw new BadRequestException('stripe did not return a checkout url')
    return { url: session.url }
  }
}
