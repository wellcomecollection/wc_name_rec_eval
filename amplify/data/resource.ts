import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a NameReconciliation database table to store 
name reconciliation data with labels, reconciled labels, and candidate matches.
The authorization rule below specifies that any user authenticated via an API 
key can "create", "read", "update", and "delete" any "NameReconciliation" records.
=========================================================================*/
const schema = a.schema({
  EvaluationResult: a.enum(['yes', 'no', 'unsure']),
  NameReconciliation: a
    .model({
      label: a.string().required(),
      idx: a.string().required(),
      reconciled_labels: a.json(),
      candidates: a.json(),
      reconciled_labels_evaluations: a.json(), // Field to store individual evaluation results as {idx: 'yes'|'no'|'unsure'}
      evaluator_id: a.string(), // Email of the user who evaluated this record
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: nameReconciliations } = await client.models.NameReconciliation.list()

// return <ul>{nameReconciliations.map(nameRec => <li key={nameRec.id}>{nameRec.label}</li>)}</ul>
