"use client";

import { useEffect } from "react";
import { Amplify } from "aws-amplify";

type ClientConfig = {
  auth: any;
  data: {
    url: string;
    aws_region: string;
    default_authorization_type: string;
    authorization_types?: string[];
    model_introspection: any;
  };
  version: string;
};

export default function AmplifyClientConfig({ config }: { config: ClientConfig }) {
  useEffect(() => {
    // Configure Amplify on the client with sanitized settings (no API key)
    Amplify.configure(config as any);
  }, [config]);

  return null;
}

