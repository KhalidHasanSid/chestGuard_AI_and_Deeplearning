import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "r1ehb21r",  // ✅ Tumhara project ID sahi hai?
  dataset: "production",
  useCdn: false,   // for latest data
  apiVersion: "2024-02-21",
});

export default client;
