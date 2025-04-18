"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { env } from "~/env";
import { api } from "~/trpc/react";

export function usePushNotifications() {
  const allTargets = api.notifications.allTargets.useQuery();
  const utils = api.useUtils();
  const createPushTarget = api.notifications.createPushTarget.useMutation({
    async onSettled(_data, _error, _variables, _context) {
      await utils.notifications.allTargets.invalidate();
    },
  });
  const removeTarget = api.notifications.removeTarget.useMutation({
    async onSettled(_data, _error, _variables, _context) {
      await utils.notifications.allTargets.invalidate();
    },
  });

  const subscriptionPromise = useMemo(
    () =>
      (async () => {
        if (typeof navigator === undefined) return;
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log(env);
        return (
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          }))
        );
      })(),
    [],
  );
  const [subscription, setSubscription] = useState<
    undefined | PushSubscription
  >();
  useEffect(() => {
    void subscriptionPromise.then(setSubscription);
  }, [subscriptionPromise]);
  const requestPushNotifications = useCallback(async () => {
    if (typeof Notification === undefined) return;
    // TODO: support older browsers??
    // https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API#getting_permission
    const p = await Notification.requestPermission();
    if (p !== "granted") {
      alert(
        "Cannot subscribe to push notifications because you have disabled them in your browser",
      );
      return;
    }
    return await subscriptionPromise;
  }, [subscriptionPromise]);
  const isSubscribed = useMemo(() => {
    if (subscription && allTargets.isSuccess) {
      return allTargets.data.find((x) =>
        x.configs.find((c) => c.endpoint === subscription.endpoint),
      )
        ? "yes"
        : "no";
    } else {
      return "pending";
    }
  }, [subscription, allTargets]);

  return useMemo(
    () => ({
      requestPushNotifications,
      allTargets,
      createPushTarget,
      isSubscribed,
      browserSubscriptionEndpoint: subscription?.endpoint,
      removeTarget,
    }),
    [
      requestPushNotifications,
      allTargets,
      createPushTarget,
      isSubscribed,
      subscription,
      removeTarget,
    ],
  );
}
