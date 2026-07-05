/**
 * Utility functions for generating unique, time-sortable IDs
 * Provides ULID-compatible ID generation with custom prefixes for entity identification
 */

import baseX from "base-x";

const prefixes = [
  "acc_", // account
  "api_", // api key
  "ct_", // contact
  "cus_", // customer
  "dev_", // device code
  "elog_", // email log
  "org_", // organization
  "invi_", // invitation
  "mem_", // member
  "pass_", // passkey
  "prod_", // product
  "proj_", // project
  "rt_", // rate limit
  "sess_", // session
  "subs_", // subscription
  "two_", // two factor auth
  "user_", // user
  "ver_", // verification token
  "wh_", // webhook
  "ws_", // workspace
] as const;

// ULID uses base32 encoding
const base32 = baseX("0123456789ABCDEFGHJKMNPQRSTVWXYZ");

/**
 * Creates a ULID-compatible buffer (48 bits timestamp + 80 bits randomness)
 *
 * @returns A 128-bit Uint8Array (6 bytes timestamp + 10 bytes randomness)
 */
function createULIDBuffer(): Uint8Array {
  const buf = new Uint8Array(16); // 128 bits total

  // Timestamp (48 bits = 6 bytes)
  const timestamp = BigInt(Date.now());
  buf[0] = Number((timestamp >> BigInt(40)) & BigInt(255));
  buf[1] = Number((timestamp >> BigInt(32)) & BigInt(255));
  buf[2] = Number((timestamp >> BigInt(24)) & BigInt(255));
  buf[3] = Number((timestamp >> BigInt(16)) & BigInt(255));
  buf[4] = Number((timestamp >> BigInt(8)) & BigInt(255));
  buf[5] = Number(timestamp & BigInt(255));

  // Randomness (80 bits = 10 bytes)
  globalThis.crypto.getRandomValues(buf.subarray(6));

  return buf;
}

/**
 * Creates a unique, time-sortable ID with a custom prefix
 * Uses ULID format encoded in base32, making the IDs lexicographically sortable
 * by creation time and collision-resistant across distributed systems.
 *
 * @param prefix - Custom string to prepend to the generated ID
 * @returns A unique, time-sortable ID string prefixed with the given value
 *
 * @example
 * ```ts
 * import { baseIdCustom } from '@/utils/functions';
 *
 * // Generate ID with custom prefix
 * const teamId = baseIdCustom({ prefix: 'team_' });
 * // Example output: 'team_01H8XGJWBWBAQ4TPFV5JQ3PYJM'
 *
 * // Use for entities outside the predefined prefix set
 * const invoiceId = baseIdCustom({ prefix: 'inv_' });
 * const apiKey = baseIdCustom({ prefix: 'sk_' });
 * ```
 */
export const baseIdCustom = ({ prefix }: { prefix: string }) => {
  const buf = createULIDBuffer();
  const id = base32.encode(buf);

  return `${prefix}${id}`;
};

/**
 * Creates a unique, time-sortable ID with a known prefix from the predefined set
 * Wraps {@link baseIdCustom} with a constrained prefix type to enforce consistency
 * across the application.
 *
 * @param prefix - One of the predefined entity prefixes (e.g. `user_`, `org_`, `sess_`)
 * @returns A unique, time-sortable ID string prefixed with the given value
 *
 * @example
 * ```ts
 * import { baseId } from '@/utils/functions';
 *
 * // Generate IDs for common entity types
 * const userId = baseId({ prefix: 'user_' });
 * // Example output: 'user_01H8XGJWBWBAQ4TPFV5JQ3PYJM'
 *
 * const orgId = baseId({ prefix: 'org_' });
 * const sessionId = baseId({ prefix: 'sess_' });
 *
 * // Use in database models
 * const user = {
 *   id: baseId({ prefix: 'user_' }),
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * };
 * ```
 */
export const baseId = ({ prefix }: { prefix: (typeof prefixes)[number] }) =>
  baseIdCustom({ prefix });
