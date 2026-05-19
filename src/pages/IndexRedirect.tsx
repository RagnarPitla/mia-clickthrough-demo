import WelcomePage from './WelcomePage';

/**
 * Root route for the Mia Console.
 *
 * Always shows the Welcome / playbooks page so users can pick a Dynamics 365
 * playbook and walk through the click-through (Welcome → Setup → Creating →
 * Dashboard). Demo mode is activated silently by the public host's bootstrap
 * script so all downstream pages get demo data without exposing `?demo=true`
 * in the URL.
 */
export default function IndexRedirect() {
  return <WelcomePage />;
}

