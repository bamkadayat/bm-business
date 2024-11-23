import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

interface CreateCheckoutSessionBody {
  priceId: string; // Expecting a price ID from the request body
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateCheckoutSessionBody = await req.json();
    const origin = req.headers.get('referer') || req.headers.get('origin') || '';

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: body.priceId, // Use the priceId from the parsed body
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
      automatic_tax: { enabled: true },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error creating Stripe session:', errorMessage);
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
