
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

const CodeBlock = ({
  children,
  title,
  lang,
}: {
  children: React.ReactNode;
  title?: string;
  lang?: string;
}) => (
  <div className="my-4">
    {title && (
      <div className="bg-muted px-4 py-2 rounded-t-lg text-sm font-mono text-muted-foreground">
        {title}
      </div>
    )}
    <pre className="bg-black p-4 rounded-b-lg overflow-x-auto">
      <code className={`language-${lang} text-sm text-white`}>{children}</code>
    </pre>
  </div>
);

const Callout = ({ children }: { children: React.ReactNode }) => (
    <div className="my-6 p-4 border-l-4 border-accent bg-accent/10 rounded-r-lg">
        <div className="text-accent-foreground">{children}</div>
    </div>
);

export default function McpDocsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl font-bold font-headline text-primary">MCP Server</h1>
        <p className="text-lg text-muted-foreground">
          Use the shadcn MCP server to browse, search, and install components from registries.
        </p>

        <hr className="my-8 border-border" />

        <p>
          The shadcn MCP Server allows AI assistants to interact with items from registries. You can browse available components, search for specific ones, and install them directly into your project using natural language.
        </p>
        <p>
          For example, you can ask an AI assistant to "Build a landing page using components from the acme registry" or "Find me a login form from the shadcn registry".
        </p>
        <p>
          Registries are configured in your project's <code>components.json</code> file.
        </p>
        <CodeBlock title="components.json" lang="json">
{`{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json"
  }
}`}
        </CodeBlock>

        <h2 className="text-3xl font-bold font-headline mt-12 mb-6">Quick Start</h2>
        <p>
          Select your MCP client and follow the instructions to configure the shadcn MCP server. If you'd like to do it manually, see the <a href="#configuration" className="text-accent underline">Configuration</a> section.
        </p>

        <Tabs defaultValue="claude" className="w-full">
          <TabsList>
            <TabsTrigger value="claude">Claude Code</TabsTrigger>
            <TabsTrigger value="cursor">Cursor</TabsTrigger>
            <TabsTrigger value="vscode">VS Code</TabsTrigger>
          </TabsList>
          <TabsContent value="claude" className="mt-4">
            <Card>
                <CardContent className="pt-6">
                    <p><strong>Run the following command</strong> in your project:</p>
                    <CodeBlock lang="bash">{`npx shadcn@latest mcp init --client claude`}</CodeBlock>
                    <p><strong>Restart Claude Code</strong> and try the following prompts:</p>
                    <ul className="list-disc pl-6 my-4 space-y-2">
                        <li>Show me all available components in the shadcn registry</li>
                        <li>Add the button, dialog and card components to my project</li>
                        <li>Create a contact form using components from the shadcn registry</li>
                    </ul>
                    <p><strong>Note:</strong> You can use <code>/mcp</code> command in Claude Code to debug the MCP server.</p>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cursor" className="mt-4">
             <Card>
                <CardContent className="pt-6">
                    <p><strong>Run the following command</strong> in your project:</p>
                    <CodeBlock lang="bash">{`npx shadcn@latest mcp init --client cursor`}</CodeBlock>
                    <p>Open <strong>Cursor Settings</strong> and <strong>Enable the MCP server</strong> for shadcn. Then try the following prompts:</p>
                     <ul className="list-disc pl-6 my-4 space-y-2">
                        <li>Show me all available components in the shadcn registry</li>
                        <li>Add the button, dialog and card components to my project</li>
                        <li>Create a contact form using components from the shadcn registry</li>
                    </ul>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="vscode" className="mt-4">
             <Card>
                <CardContent className="pt-6">
                    <p><strong>Run the following command</strong> in your project:</p>
                    <CodeBlock lang="bash">{`npx shadcn@latest mcp init --client vscode`}</CodeBlock>
                    <p>Open <code>.vscode/mcp.json</code> and click <strong>Start</strong> next to the shadcn server. Then try the following prompts with GitHub Copilot:</p>
                     <ul className="list-disc pl-6 my-4 space-y-2">
                        <li>Show me all available components in the shadcn registry</li>
                        <li>Add the button, dialog and card components to my project</li>
                        <li>Create a contact form using components from the shadcn registry</li>
                    </ul>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <h2 className="text-3xl font-bold font-headline mt-12 mb-6">What is MCP?</h2>
        <p>
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-accent underline">Model Context Protocol (MCP)</a> is an open protocol that enables AI assistants to securely connect to external data sources and tools. With the shadcn MCP server, your AI assistant gains direct access to:
        </p>
        <ul className="list-disc pl-6 my-4 space-y-2">
            <li><strong>Browse Components</strong> - List all available components, blocks, and templates from any configured registry</li>
            <li><strong>Search Across Registries</strong> - Find specific components by name or functionality across multiple sources</li>
            <li><strong>Install with Natural Language</strong> - Add components using simple conversational prompts like "add a login form"</li>
            <li><strong>Support for Multiple Registries</strong> - Access public registries, private company libraries, and third-party sources</li>
        </ul>
        
        <h2 id="configuration" className="text-3xl font-bold font-headline mt-12 mb-6">Configuration</h2>
        <p>You can use any MCP client to interact with the shadcn MCP server. Here are the instructions for the most popular ones.</p>

        <h3 className="text-2xl font-bold font-headline mt-8 mb-4">Claude Code</h3>
        <p>To use the shadcn MCP server with Claude Code, add the following configuration to your project's <code>.mcp.json</code> file:</p>
        <CodeBlock title=".mcp.json" lang="json">
{`{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}`}
        </CodeBlock>

        <h3 className="text-2xl font-bold font-headline mt-8 mb-4">Cursor</h3>
        <p>To configure MCP in Cursor, add the shadcn server to your project's <code>.cursor/mcp.json</code> configuration file:</p>
        <CodeBlock title=".cursor/mcp.json" lang="json">
{`{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}`}
        </CodeBlock>
        
        <h2 className="text-3xl font-bold font-headline mt-12 mb-6">Configuring Registries</h2>
        <p>The MCP server supports multiple registries through your project's <code>components.json</code> configuration. This allows you to access components from various sources including private registries and third-party providers.</p>
        <p>Configure additional registries in your <code>components.json</code>:</p>
        <CodeBlock title="components.json" lang="json">
{`{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer \${REGISTRY_TOKEN}"
      }
    }
  }
}`}
        </CodeBlock>
        <Callout>
            <strong>Note:</strong> No configuration is needed to access the standard shadcn/ui registry.
        </Callout>

      </div>
    </div>
  );
}
