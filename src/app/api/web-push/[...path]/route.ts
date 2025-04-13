import type { NextRequest } from 'next/server';
import { sendNotification, setVapidDetails, type PushSubscription } from 'web-push';
import { env } from '~/env';

setVapidDetails(
  'mailto:mail@example.com',
  env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
);

let subscription: PushSubscription;

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  switch (pathname) {
    case '/api/web-push/subscription':
      return setSubscription(request);
    case '/api/web-push/send':
      return sendPush(request);
    default:
      return notFoundApi();
  }
}

async function setSubscription(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body: { subscription: PushSubscription } = await request.json();
  subscription = body.subscription;
  return new Response(JSON.stringify({ message: 'Subscription set.' }), {});
}

async function sendPush(request: NextRequest) {
  console.log(subscription, 'subs');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body = await request.json();
  const pushPayload = JSON.stringify(body);
  await sendNotification(subscription, pushPayload);
  return new Response(JSON.stringify({ message: 'Push sent.' }), {});
}

async function notFoundApi() {
  return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 404,
  });
}