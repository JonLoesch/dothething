"use client";

import { Tooltip } from "flowbite-react";
import { useCallback, useState, type FC } from "react";
import { env } from "~/env";
import { api } from "~/trpc/react";
import { validators } from "../_util/validators";
import {
  ArrowPathIcon,
  BellIcon,
  BellSlashIcon,
} from "@heroicons/react/24/outline";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useDefaultTooltipPlacement } from "../_util/defaultTooltipPlacement";

export const PushNotification: FC = () => {
  const isSubscribed = api.pushNotifications.isSubscribed.useQuery();
  const notificationsSupportedOnThisBrowser =
    navigator &&
    "serviceWorker" in navigator &&
    window &&
    "PushManager" in window &&
    "showNotification" in ServiceWorkerRegistration.prototype;

  const subscribe = api.pushNotifications.subscribe.useMutation();
  const unsubscribe = api.pushNotifications.unsubscribe.useMutation();
  const [permission, setPermission] = useState(Notification.permission);
  const [inFlight, setInFlight] = useState(false);
  
  const wrapInFlight = useCallback((proc: () => Promise<void>) => {
    return async () => {
      try {
        setInFlight(true);
        await proc();
      }
       finally {
        setInFlight(false);
       }
    }
  }, []);

  const placement = useDefaultTooltipPlacement();

  const wrapperClass = "px-6 py-2";

  if (inFlight) {
    return <Tooltip content="Pending ..." placement={placement}>
        <div className={wrapperClass}>
          <ArrowPathIcon />
        </div>
      </Tooltip>
  }
  else if (isSubscribed.isLoading) {
    return (
      <Tooltip content="Loading ..."  placement={placement}>
        <div className={wrapperClass}>
          <ArrowPathIcon />
        </div>
      </Tooltip>
    );
  } else if (!isSubscribed.isSuccess) {
    return (
      <Tooltip content="Network error -- try refreshing the page" placement={placement}>
        <div className={wrapperClass}>
          <ExclamationCircleIcon className="text-red-600" />
        </div>
      </Tooltip>
    );
  } else if (isSubscribed.data) {
    return (
      <Tooltip content="You are subscribed to push notifications from DoTheThing" placement={placement}>
        <div
          className={wrapperClass}
          onClick={wrapInFlight(async () => {
            await Promise.all([
              (async () => {
                // unsubscribe on the client
                const registration =
                  await navigator.serviceWorker.register("/sw.js");
                const subscription =
                  await registration.pushManager.getSubscription();
                await subscription?.unsubscribe();
              })(),
              (async () => {
                // unsubscribe on the server
                await unsubscribe.mutateAsync();
                await isSubscribed.refetch();
              })(),
            ]);
          })}
        >
          <BellIcon />
        </div>
      </Tooltip>
    );
  } else if (!notificationsSupportedOnThisBrowser) {
    return (
      <Tooltip content="Push Notifications are not supported on this web browser" placement={placement}>
        <div className={wrapperClass}>
          <BellSlashIcon />
        </div>
      </Tooltip>
    );
  } else {
    return (
      <Tooltip
        content={
          permission === "denied"
            ? "You have disabled push notifications in your browser settings"
            : "You are not subscribed to push notifications"
        }
        placement={placement}
      >
        <div
          className={wrapperClass}
          onClick={wrapInFlight(async () => {
            const p = await Notification.requestPermission();
            setPermission(p);
            if (p !== "granted") {
              alert(
                "Cannot subscribe to push notifications because you have disabled them in your browser",
              );
              return;
            }
            const registration =
              await navigator.serviceWorker.register("/sw.js");
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });
            await subscribe.mutateAsync(
              validators.requests.pushNotificationSubscription.parse(
                subscription.toJSON(),
              ),
            );
            await isSubscribed.refetch();
            // .then((subscription: PushSubscription) => {
            //   // submit subscription to server.
            //   submitSubscription(subscription).then((_) => {
            //     onSubscribe(subscription);
            //   });
            // })
            // .catch((e) => {
            //   console.error("Failed to subscribe cause of: ", e);
            // });
          })}
        >
          <BellSlashIcon />
        </div>
      </Tooltip>
    );
  }

  // return (
  //   <>
  //     <Button
  //       onClick={async () => {
  //         const endPointUrl = "/api/web-push/send";
  //         const pushBody = {
  //           title: "Test Push",
  //           body: "This is a test push message",
  //           image: "/next.png",
  //           icon: "nextjs.png",
  //           url: "https://google.com",
  //         };
  //         const res = await fetch(endPointUrl, {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify(pushBody),
  //         });
  //         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //         const result = await res.json();
  //         console.log(result);
  //       }}
  //     >
  //       Test push
  //     </Button>
  //   </>
  // );
};
