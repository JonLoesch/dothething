import type { Metadata } from "next";
import { DisplayPageTitle } from "~/app/_util/PageTitle";

export const metadata: Metadata = {
  title: "DoTheThing",
  description: "A simple reminder application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default DisplayPageTitle('Do The Thing: a simple reminder application');