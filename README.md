# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

## TODO Next
- User stories in mobile:
  - On delete group: show # of lined tasks, subscriptions on confirm dialog / cascade
  - Edit Task
    - Mark task as complete
    - Manually adjust next date
  - Subscribe/unsubscribe to push notiications
    - show # of groups on profile subscription page, disable delete if nonzero
- [DaisyUI Status](https://daisyui.com/components/status/) on tasks
- Make cron respect time of day (and zone)

 
## TODO Later
- fake data libraries for optimistic updates
- sectioned layout
  - fullscreen width controls
- toDateString shouldn't be littered (centralize in DB adapter)
- User stories in both mobile and fullscreen:
  - Suggest a feature
- User stories in both mobile and fullscreen:
- Splash / marketing page
- optimistic updates factored out
  - immer might be good for useMutation optimistic updates
  - is it possible to apply default options as a middleware?
- Smoother Display of API errors
  - fade in / out
  - dismiss functionality
  - after fade out, should still be able to pull up via corner widget or something

## TODO cleanup
- Look into zod branding
- react fragment navigation
- mailto header on VAPID details
- Get NavLinks back (current page in site map should have visual indicator)
- Notifications UI - service worker caching??
- Test all cases of notification / permissions :(
- use browser icons from uaparser
- db prefix unnecessary
- prisma?
- Look into [atlas](https://atlasgo.io/docs)
- RAC transition logic is in globals.css, can it be Tailwinded?

## Other
- Idea for linting that imports follow some declarative structure (i.e. don't import RAC from higher level code)

## Target site layout

Pages:
  - About - to fill out later
  - My stuff:
    - List of task groups
      - List of tasks
      - each task group has notification settings / associated edit GUI
    - Profile page
      - edit linked notification methods
  - Tech specs

Modals?
  - Edit / add notification vector GUI
  - Edit / add recurring task



## Helpful snippets:

- Migrate production:
`env "$(sed -n 's/^PRODUCTION_FOR_MIGRATING_MANUALLY_//p' .env)" pnpm db:push`
`psql "$(sed -n 's/^PRODUCTION_FOR_MIGRATING_MANUALLY_DATABASE_URL=//p' .env)"`