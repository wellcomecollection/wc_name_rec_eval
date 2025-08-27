import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./app.css";
import { Amplify } from "aws-amplify";

import AuthenticatorWrapper from "./AuthenticatorWrapper";
import "@aws-amplify/ui-react/styles.css";

import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Name Reconciliation Service",
  description: "A Wellcome Collection service for reconciling names.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthenticatorWrapper>{children}</AuthenticatorWrapper>
      </body>
    </html>
  );
}
