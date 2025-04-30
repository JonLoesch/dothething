"use client";;
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { env } from "~/env";
import { useTRPC } from "~/trpc/react";

import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

export function usePushNotifications() {
  const api = useTRPC();
  const allTargets = useQuery(api.notifications.allTargets.queryOptions());
  const queryClient = useQueryClient();
  const createPushTarget = useMutation(api.notifications.createPushTarget.mutationOptions({
    async onSettled(_data, _error, _variables, _context) {
      await queryClient.invalidateQueries(api.notifications.allTargets.pathFilter());
    },
  }));
  const removeTarget = useMutation(api.notifications.removeTarget.mutationOptions({
    async onSettled(_data, _error, _variables, _context) {
      await queryClient.invalidateQueries(api.notifications.allTargets.pathFilter());
    },
  }));

  const [subscription, setSubscription] = useState<
    PushSubscription | "pending" | "denied" | null
  >("pending");
  const getCurrentBrowserSubscriptionStatus = useMemo(async () => {
    if (typeof navigator === "undefined" || typeof navigator.serviceWorker === "undefined") return null;
    const registration = await navigator.serviceWorker.register("/sw.js");
    return await registration.pushManager.getSubscription();
  }, []);
  useEffect(
    () =>
      void getCurrentBrowserSubscriptionStatus.then((currentBrowserStatus) =>
        setSubscription((s) => (s === "pending" ? currentBrowserStatus : s)),
      ),
    [getCurrentBrowserSubscriptionStatus],
  );
  const requestPushNotifications = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    // TODO: support older browsers??
    // https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API#getting_permission
    const p = await Notification.requestPermission();
    if (p !== "granted") {
      setSubscription("denied");
      alert(
        "Cannot subscribe to push notifications because you have disabled them in your browser",
      );
      return;
    }
    const existingSubsccription = await getCurrentBrowserSubscriptionStatus;
    if (existingSubsccription) {
      return existingSubsccription;
    }
    if (!existingSubsccription) {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      setSubscription(newSubscription);
      return newSubscription;
    }
    
  }, [getCurrentBrowserSubscriptionStatus]);
  const isSubscribed = useMemo(() => {
    if (subscription === "pending") {
      return "pending";
    } else if (subscription === "denied") {
      return "denied";
    } else if (!allTargets.isSuccess) {
      return "pending";
    } else if (subscription === null) {
      return "no";
    } else {
      return allTargets.data.find((x) =>
        x.configs.find((c) => c.endpoint === subscription.endpoint),
      )
        ? "yes"
        : "no";
    }
  }, [subscription, allTargets]);

  return useMemo(
    () => ({
      requestPushNotifications,
      allTargets,
      createPushTarget,
      browserEndpoint:
        typeof subscription === "string" || subscription === null
          ? null
          : subscription.endpoint,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      isSubscribed: isSubscribed as typeof isSubscribed,
      removeTarget,
    }),
    [
      requestPushNotifications,
      allTargets,
      createPushTarget,
      subscription,
      isSubscribed,
      removeTarget,
    ],
  );
}
