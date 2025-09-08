import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./app.css";
import { Amplify } from "aws-amplify";

import AuthenticatorWrapper from "./AuthenticatorWrapper";
import "@aws-amplify/ui-react/styles.css";

import outputs from "@/amplify_outputs.json";
import AmplifyClientConfig from "./lib/AmplifyClientConfig";

// Configure Amplify on the server for SSR utilities if needed.
// Client is configured via <AmplifyClientConfig /> with a sanitized config.
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
  // Build a sanitized client config (no API key; Cognito as default auth)
  const clientConfig = {
    auth: outputs.auth,
    data: {
      url: outputs.data.url,
      aws_region: outputs.data.aws_region,
      default_authorization_type: "AMAZON_COGNITO_USER_POOLS",
      authorization_types: (outputs.data.authorization_types || []).filter(
        (t: string) => t !== "API_KEY"
      ),
      model_introspection: outputs.data.model_introspection,
    },
    version: outputs.version,
  } as const;

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Configure Amplify client-side without exposing API key */}
        <AmplifyClientConfig config={clientConfig} />
        <AuthenticatorWrapper>{children}</AuthenticatorWrapper>
      </body>
    </html>
  );
}
