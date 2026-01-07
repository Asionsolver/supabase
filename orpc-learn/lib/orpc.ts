// import { router } from "@/router";
// import { createORPCClient } from "@orpc/client";
// import { RPCLink } from "@orpc/client/fetch";
// import { RouterClient } from "@orpc/server";

// const rpcLink = new RPCLink({
//   url: "http://localhost:3000",
// });

// export const orpcClient: RouterClient<typeof router> =
//   createORPCClient(rpcLink);

import type { RouterClient } from "@orpc/server";
import { RPCLink } from "@orpc/client/fetch";
import { createORPCClient } from "@orpc/client";
import { router } from "@/router";

declare global {
  var $client: RouterClient<typeof router> | undefined;
}

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink is not allowed on the server side.");
    }

    return `${window.location.origin}/rpc`;
  },
});

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const client: RouterClient<typeof router> =
  globalThis.$client ?? createORPCClient(link);
