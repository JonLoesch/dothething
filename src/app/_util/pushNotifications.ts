"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
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

  const [browserData, setBrowserData] = useReducer<
    "pending" | "denied" | { endpoint: string },
    [PushSubscription | null | undefined]
  >((state, sub: PushSubscription | null | undefined | "denied") => {
    return sub
      ? sub === "denied"
        ? "denied"
        : {
            endpoint: sub.endpoint,
          }
      : state;
  }, "pending");
  const existingSubscriptionPromise = useMemo(async () => {
    if (typeof navigator === "undefined") return;
    const registration = await navigator.serviceWorker.register("/sw.js");
    return await registration.pushManager.getSubscription();
  }, []);
  useEffect(
    () => void existingSubscriptionPromise.then(setBrowserData),
    [existingSubscriptionPromise],
  );
  const requestPushNotifications = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    // TODO: support older browsers??
    // https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API#getting_permission
    const p = await Notification.requestPermission();
    if (p !== "granted") {
      alert(
        "Cannot subscribe to push notifications because you have disabled them in your browser",
      );
      return;
    }
    const existingSubsccription = await existingSubscriptionPromise;
    if (!existingSubsccription) {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      setBrowserData(newSubscription);
      return newSubscription;
    }
  }, [existingSubscriptionPromise]);
  const isSubscribed = useMemo(() => {
    if (typeof browserData === "string") {
      return browserData;
    } else if (!allTargets.isSuccess) {
      return "pending";
    } else {
      return allTargets.data.find((x) =>
        x.configs.find((c) => c.endpoint === browserData.endpoint),
      )
        ? "yes"
        : "no";
    }
  }, [browserData, allTargets]);

  return useMemo(
    () => ({
      requestPushNotifications,
      allTargets,
      createPushTarget,
      browserData,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      isSubscribed: isSubscribed as typeof isSubscribed,
      removeTarget,
    }),
    [
      requestPushNotifications,
      allTargets,
      createPushTarget,
      browserData,
      isSubscribed,
      removeTarget,
    ],
  );
}
