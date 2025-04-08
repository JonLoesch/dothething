import type { Metadata } from "next";
import { DisplayPageTitle } from "~/app/_util/PageTitle";

export const metadata: Metadata = {
    title: 'My Things (to do)',
}

export default DisplayPageTitle(metadata);