"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavLink: typeof Link = ({ href, ...rest }) => {
  const pathname = usePathname();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (pathname === href) {
        ref.current.setAttribute("aria-current", "page");
      } else {
        ref.current.removeAttribute("aria-current");
      }
    }
  }, [href, pathname]);

  return <Link href={href} {...rest} ref={ref} />;
};

export default NavLink;
