import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for Stripe signature verification
  },
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks = [];
  let done, value;

  while ({ done, value } = await reader.read(), !done) {
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await streamToBuffer(req.body as ReadableStream);
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Webhook signature verification failed:', errorMessage);
      return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
    }

    // Log and handle the event
    console.log('✅ Success:', event.id);
    return new NextResponse('Success', { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error processing request:', errorMessage);
    return new NextResponse(`Error: ${errorMessage}`, { status: 500 });
  }
}