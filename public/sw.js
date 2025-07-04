// @ts-nocheck
// self.addEventListener("install", () => {
//   console.info("service worker installed.");
// });
// console.info("service worker executed.");

// const sendDeliveryReportAction = () => {
//   console.log("Web push delivered.");
// };

self.addEventListener("push", function (event) {
  // console.log(event);
  if (!event.data) {
    return;
  }

  const payload = event.data.json();
  const { body, icon, image, badge, url, title } = payload;
  const notificationTitle = title ?? "Hi";
  const notificationOptions = {
    body,
    icon,
    image,
    data: {
      url,
    },
    badge,
  };

  event.waitUntil(
    self.registration
      .showNotification(notificationTitle, notificationOptions)
      // .then(() => {
      //   sendDeliveryReportAction();
      // }),
  );
});
