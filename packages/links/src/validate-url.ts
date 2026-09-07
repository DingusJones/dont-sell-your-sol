export function safeUrl(value: string, hosts: readonly string[]): boolean {
  try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password && !u.port && hosts.includes(u.hostname) && !u.hash && !/[\\\s]/.test(value); } catch { return false; }
}
