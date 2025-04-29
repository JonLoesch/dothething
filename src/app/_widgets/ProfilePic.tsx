"use client";

import Image from "next/image";
import { useState, type FC } from "react";
import { Icon } from "../_fragments/Icon";

export const ProfilePic: FC<{ src?: string }> = (props) => {
  const [altVisible, setAltVisible] = useState(props.src === undefined);
  return (
    <>
      {props.src && (
        <Image
          alt="Profile Image"
          src={props.src}
          className={`rounded-full ${altVisible ? "hidden" : "block"}`}
          width={48}
          height={48}
          onError={() => {
            setAltVisible(true);
          }}
        />
      )}
      <Icon.Anonymous className={altVisible ? "block" : "hidden"} />
    </>
  );
};
