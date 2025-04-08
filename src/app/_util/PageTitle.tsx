import type { Metadata } from "next";
import type { FC } from "react";

export function DisplayPageTitle(metadata: Metadata | string): FC {
    // eslint-disable-next-line react/display-name
    return () => <>{typeof metadata === 'string' ? metadata : metadata.title}</>;
}