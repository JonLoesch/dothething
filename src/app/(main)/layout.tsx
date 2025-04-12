import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

import "~/styles/globals.css";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { type ReactNode } from "react";
import NavLink from "../_components/NavLink";
import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { ConditionalWrap } from "../_util/ConditionalWrap";

const links: HeaderLink[] = [
  { name: "About", href: "/", sidebar: false, requiresLogin: false },
  { name: "My Things", href: "/my/list", sidebar: false, requiresLogin: true },
  {
    name: "Your Profile",
    href: "/my/profile",
    sidebar: false,
    requiresLogin: true,
  },
  {
    name: "Sign Out",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    href: "/api/auth/signout" as any,
    sidebar: true,
    requiresLogin: true,
  },
];

type HeaderLink = {
  name: string;
  href: Parameters<typeof Link>[0]["href"];
  sidebar: boolean;
  requiresLogin: boolean;
};

async function Layout(
  props: React.PropsWithChildren<{
    title: ReactNode;
  }>,
) {
  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable} h-full bg-gray-100`}>
      <body className="h-full">
        <TRPCReactProvider>
          <div className="min-h-full">
            <div className="bg-indigo-600 pb-32">
              <Disclosure
                as="nav"
                className="border-b border-indigo-300/25 bg-indigo-600 lg:border-none"
              >
                <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
                  <div className="relative flex h-16 items-center justify-between lg:border-b lg:border-indigo-400/25">
                    <div className="flex items-center px-2 lg:px-0">
                      <div className="shrink-0">
                        <img
                          alt="Your Company"
                          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=300"
                          className="block size-8"
                        />
                      </div>
                      <div className="hidden lg:ml-10 lg:block">
                        <div className="flex space-x-4">
                          {links.map(
                            (item) =>
                              !(
                                item.sidebar ||
                                (item.requiresLogin && !session?.user)
                              ) && (
                                <NavLink
                                  key={item.name}
                                  href={item.href}
                                  className="rounded-md px-3 py-2 text-sm font-medium text-white not-aria-[current]:hover:bg-indigo-500/75 aria-[current]:bg-indigo-700"
                                >
                                  {item.name}
                                </NavLink>
                              ),
                          )}
                        </div>
                      </div>
                    </div>
                    {/* <div className="flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end">
                      <div className="grid w-full max-w-lg grid-cols-1 lg:max-w-xs">
                        <input
                          name="search"
                          type="search"
                          placeholder="Search"
                          aria-label="Search"
                          className="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-hidden placeholder:text-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-white/40 sm:text-sm/6"
                        />
                        <MagnifyingGlassIcon
                          aria-hidden="true"
                          className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400"
                        />
                      </div>
                    </div> */}
                    <div className="flex lg:hidden">
                      {/* Mobile menu button */}
                      <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-indigo-600 p-2 text-indigo-200 hover:bg-indigo-500/75 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 focus:outline-hidden">
                        <span className="absolute -inset-0.5" />
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon
                          aria-hidden="true"
                          className="block size-6 group-data-open:hidden"
                        />
                        <XMarkIcon
                          aria-hidden="true"
                          className="hidden size-6 group-data-open:block"
                        />
                      </DisclosureButton>
                    </div>
                    <div className="hidden lg:ml-4 lg:block">
                      <div className="flex items-center">
                        {/* <button
                          type="button"
                          className="relative shrink-0 rounded-full bg-indigo-600 p-1 text-indigo-200 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 focus:outline-hidden"
                        >
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">View notifications</span>
                          <BellIcon aria-hidden="true" className="size-6" />
                        </button> */}

                        {/* Profile dropdown */}
                        {session?.user ? (
                          <Menu as="div" className="relative ml-3 shrink-0">
                            <div>
                              <MenuButton className="relative flex rounded-full text-sm text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 focus:outline-hidden">
                                <span className="absolute -inset-1.5" />
                                <span className="sr-only">Open user menu</span>

                                {session.user.image !== null ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    alt=""
                                    src={session.user.image}
                                    className="size-8 rounded-full"
                                  />
                                ) : (
                                  <UserIcon className="size-8" />
                                )}
                              </MenuButton>
                            </div>
                            <MenuItems
                              transition
                              className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                            >
                              {links.map(
                                (item) =>
                                  item.sidebar && (
                                    <MenuItem key={item.name}>
                                      <NavLink
                                        href={item.href}
                                        className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                                      >
                                        {item.name}
                                      </NavLink>
                                    </MenuItem>
                                  ),
                              )}
                            </MenuItems>
                          </Menu>
                        ) : (
                          <Link
                            href="/api/auth/signin"
                            className="flex items-center gap-3 text-white"
                          >
                            <UserCircleIcon className="size-8" />
                            Sign in
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <DisclosurePanel className="lg:hidden">
                  <div className="space-y-1 px-2 pt-2 pb-3">
                    {links.map(
                      (item) =>
                        !(item.sidebar || (item.requiresLogin && !session?.user)) && (
                          <NavLink
                            href={item.href}
                            passHref
                            key={item.name}
                            legacyBehavior
                          >
                            <DisclosureButton
                              as="a"
                              className="block rounded-md px-3 py-2 text-base font-medium text-white not-aria-[current]:hover:bg-indigo-500/75 aria-[current]:bg-indigo-700"
                            >
                              {item.name}
                            </DisclosureButton>
                          </NavLink>
                        ),
                    )}
                  </div>
                  <div className="border-t border-indigo-700 pt-4 pb-3">
                    {ConditionalWrap(
                      [
                        [
                          !session?.user,
                          ({ children }) => (
                            <Link href="/api/auth/signin">{children}</Link>
                          ),
                        ],
                      ],
                      <div className="flex items-center px-5">
                        <div className="shrink-0">
                          {session?.user.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              alt=""
                              src={session.user.image}
                              className="size-10 rounded-full"
                            />
                          ) : (
                            <UserIcon className="size-10 text-white" />
                          )}
                        </div>
                        <div className="ml-3">
                          {session?.user ? (
                            <>
                              <div className="text-base font-medium text-white">
                                {session.user.name}
                              </div>
                              <div className="text-sm font-medium text-indigo-300">
                                {session.user.email}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-base font-medium text-white">
                                Sign in
                              </div>
                            </>
                          )}
                        </div>
                        {/* <button
                        type="button"
                        className="relative ml-auto shrink-0 rounded-full bg-indigo-600 p-1 text-indigo-200 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 focus:outline-hidden"
                      >
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">View notifications</span>
                        <BellIcon aria-hidden="true" className="size-6" />
                      </button> */}
                      </div>,
                    )}
                    {session?.user && (
                      <div className="mt-3 space-y-1 px-2">
                        {links.map((item) => (
                          item.sidebar &&
                          <NavLink
                            key={item.name}
                            legacyBehavior
                            passHref
                            href={item.href}
                          >
                            <DisclosureButton
                              as="a"
                              className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-indigo-500/75"
                            >
                              {item.name}
                            </DisclosureButton>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                </DisclosurePanel>
              </Disclosure>
              <header className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    {props.title}
                  </h1>
                </div>
              </header>
            </div>

            <main className="-mt-32">
              <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                <div className="rounded-lg bg-white px-5 py-6 shadow-sm sm:px-6">
                  <HydrateClient>{props.children}</HydrateClient>
                </div>
              </div>
            </main>
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

export default Layout;
