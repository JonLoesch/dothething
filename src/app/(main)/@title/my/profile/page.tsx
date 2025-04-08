import type { Metadata } from "next";
import { DisplayPageTitle } from "~/app/_util/PageTitle";

export const metadata: Metadata = {
    title: 'Profile',
}
export default DisplayPageTitle(metadata);