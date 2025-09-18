"use client";

import { Authenticator, View } from "@aws-amplify/ui-react";
import Image from "next/image";
import "./auth.css";
import { usePathname } from "next/navigation";

export default function AuthenticatorWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const publicRoutes = ["/terms", "/privacy"];

  // Allow public pages (no auth required) so legal content is accessible pre-login
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="auth-wrapper">
      <Authenticator
        components={{
          Header() {
            return (
              <View className="auth-header" as="header">
                <div className="auth-header-inner">
                  <Image
                    src="/Wellcome_Trust_logo.svg"
                    alt="Wellcome Trust"
                    width={140}
                    height={60}
                    className="auth-logo"
                    priority
                  />
                  <h1 className="auth-title">Name Reconciliation Service</h1>
                  <p className="auth-subtitle">
                    <span className="auth-subtitle--highlight">
                      Please create an account using your Wellcome Trust email
                    </span>{" "}
                    and sign in to help evaluate and improve our reconciliation
                    models.
                  </p>
                </div>
              </View>
            );
          },
        }}
        className="custom-authenticator"
      >
        {children}
      </Authenticator>
    </div>
  );
}
