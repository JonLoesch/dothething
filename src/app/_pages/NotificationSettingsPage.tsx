"use client";

import type { FC } from "react";
import { PageLayout } from "../_components/PageLayout";
import { titles } from "../_util/titles";
import { env } from "~/env";
import { usePushNotifications } from "../_util/pushNotifications";
import { validators } from "../_util/validators";
import { pushConfig } from "~/model/pushConfig";
import { api } from "~/trpc/react";
import { Icon } from "../_components/icons";

export const NotificationSettingsPage: FC = () => {
  const {
    allTargets,
    createPushTarget,
    requestPushNotifications,
    isSubscribed,
    removeTarget,
    browserEndpoint,
  } = usePushNotifications();
  const testCron = api.crons.runTestNotifications.useMutation();

  return (
    <PageLayout title={titles.notificationSettings}>
      <div className="list">
        {allTargets.isSuccess &&
          allTargets.data.map((t) => (
            <li key={t.id} className="list-row">
              <div className="list-col-grow">
                {t.title}
                {t.configs.find(
                  (c) =>
                    c.endpoint === browserEndpoint,
                )
                  ? " (this browser)"
                  : ""}
              </div>
              <button
                className="btn btn-circle btn-ghost text-error size-5"
                onClick={() => removeTarget.mutate(t)}
              >
                <Icon.Trash />
              </button>
            </li>
          ))}
      </div>
      {isSubscribed === "no" && (
        <button
          className="btn"
          onClick={() => {
            void requestPushNotifications().then(
              (r) =>
                r &&
                createPushTarget.mutate(pushConfig.validator.parse(r.toJSON())),
            );
          }}
        >
          Subscribe
        </button>
      )}
      {isSubscribed === 'denied' && (
        <div>
          You have disabled push notifications in your browser.  In order to subscribe to notifications, please adjust your browser settings and refresh the page.
        </div>
      )}
      <button className="btn" onClick={() => testCron.mutate()}>
        Test Crons
      </button>
    </PageLayout>
  );
};
