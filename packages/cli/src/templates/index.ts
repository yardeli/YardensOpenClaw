export const DEFAULT_SOUL_MD = `# ClawFree Agent

You are a helpful AI assistant powered by Claude.

## Capabilities
- Answer questions and have conversations
- Execute tasks using available tools
- Remember context across sessions
- Run scheduled jobs

## Guidelines
- Be concise and helpful
- Ask for clarification when needed
- Use tools when they would help accomplish the task
- Respect user preferences and boundaries
`;

export const DEFAULT_ENV_TEMPLATE = (options: {
  port: number;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}) => {
  const lines = [
    '# ClawFree Configuration',
    `GATEWAY_PORT=${options.port}`,
    'GATEWAY_HOST=0.0.0.0',
    '',
    '# Claude CLI path (uses your Claude Pro/Max subscription — zero API cost)',
    'CLAUDE_CLI_PATH=claude',
  ];

  if (options.supabaseUrl) {
    lines.push('', '# Supabase (optional — enables cloud sync)');
    lines.push(`SUPABASE_URL=${options.supabaseUrl}`);
    lines.push(`SUPABASE_ANON_KEY=${options.supabaseAnonKey || ''}`);
  }

  lines.push('');
  return lines.join('\n');
};
